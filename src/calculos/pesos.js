/*
 * Punto unico de calculo de peso de trailer, carga y VGM.
 *
 * Toda la aplicacion debe pasar por aqui: tener la formula repetida en los
 * controladores y en los modales del front fue lo que permitio que el tiquete
 * original y su reimpresion mostraran cifras distintas.
 *
 * Las funciones "aplicar*" son puras: reciben la fila de Trailers y devuelven
 * como queda tras el movimiento. El servicio las usa para armar el UPDATE, y
 * las pruebas de escenario encadenan movimientos sin tocar la base.
 */

/*
 * Convierte a entero o devuelve null. parseInt(null) da NaN y NaN se propaga
 * en silencio hasta la base de datos, que era el origen de los pesos de
 * trailer corruptos.
 */
function entero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero) : null;
}

/*
 * Hay contenedor cuando el movimiento trae numero de contenedor. Un trailer
 * que entra o sale vacio no lo tiene.
 */
function hayContenedor(noContenedor) {
  return String(noContenedor ?? '').trim() !== '';
}

/*
 * Peso del trailer despejado de un pesaje: el conjunto menos el vehiculo solo.
 *
 * Solo es valido si el trailer iba VACIO en ese pesaje. Con el trailer cargado
 * la resta deja trailer + mercancia, y no hay forma fisica de separarlos con
 * un solo pesaje: por eso un extremo con contenedor no aporta determinacion.
 */
function determinar({ conjunto, taraVehiculo, conCarga }) {
  if (conCarga) return null;
  const total = entero(conjunto);
  const vehiculo = entero(taraVehiculo);
  if (total === null || vehiculo === null) return null;
  const peso = total - vehiculo;
  return peso > 0 ? peso : null;
}

/*
 * Peso del trailer independiente del vehiculo: promedio de las determinaciones
 * validas del viaje. Con una sola se devuelve esa, y sin ninguna null en vez de
 * cero, para no publicar un dato que todavia no se ha medido.
 */
function promediar(determinaciones) {
  const validas = determinaciones.filter((valor) => entero(valor) !== null);
  if (validas.length === 0) return null;
  const suma = validas.reduce((total, valor) => total + entero(valor), 0);
  return Math.round(suma / validas.length);
}

function pesoTrailer(fila) {
  return promediar([fila?.Peso_Trailer_Entrada, fila?.Peso_Trailer_Salida]);
}

/*
 * Diferencia absoluta entre las dos determinaciones. Solo tiene valor cuando
 * ambas existen. Se registra para poder fijar una tolerancia con datos reales;
 * hoy no bloquea ni alerta.
 */
function diferenciaDeterminaciones(fila) {
  const entrada = entero(fila?.Peso_Trailer_Entrada);
  const salida = entero(fila?.Peso_Trailer_Salida);
  if (entrada === null || salida === null) return null;
  return Math.abs(entrada - salida);
}

/* Recalcula las columnas derivadas de una fila. */
function conDerivadas(fila) {
  return {
    ...fila,
    Peso_Trailer: pesoTrailer(fila),
    Diferencia_Determinaciones: diferenciaDeterminaciones(fila),
  };
}

/*
 * El vehiculo se peso solo, sin trailer. Su tara alimenta la determinacion de
 * entrada si es el que lo trajo (taraCab1 aun vacia) o la de salida si es el
 * que se lo va a llevar.
 */
function aplicarTaraVehiculo(fila, { taraVehiculo, conCarga = false }) {
  const tara = entero(taraVehiculo);
  if (tara === null) return fila;

  const esPrimerVehiculo = entero(fila.taraCab1) === null;

  if (esPrimerVehiculo) {
    return conDerivadas({
      ...fila,
      taraCab1: tara,
      Peso_Trailer_Entrada: determinar({
        conjunto: fila.Peso_Entrada,
        taraVehiculo: tara,
        conCarga,
      }),
    });
  }

  return conDerivadas({
    ...fila,
    taraCab2: tara,
    Peso_Trailer_Salida: determinar({
      conjunto: fila.Peso_Salida,
      taraVehiculo: tara,
      conCarga,
    }),
  });
}

/*
 * El vehiculo se lleva el trailer: se registra el peso del conjunto a la salida
 * y se cierra el viaje.
 *
 * taraCab2 se resuelve aqui y no al entrar el vehiculo: cuando entra a buscar
 * trailer todavia no se sabe cual se llevara, asi que no hay a que fila
 * asociar su tara. Al salir si se sabe, y el propio movimiento ya trae sus dos
 * pesajes.
 */
function aplicarSalida(fila, { placa, pesoConjunto, taraVehiculo, conCarga = false }) {
  const conjunto = entero(pesoConjunto);
  const tara = entero(taraVehiculo) ?? entero(fila.taraCab2);

  return conDerivadas({
    ...fila,
    Placa_Salida: placa,
    Peso_Salida: conjunto,
    taraCab2: tara,
    Peso_Trailer_Salida: determinar({
      conjunto,
      taraVehiculo: tara,
      conCarga,
    }),
    Culminado: true,
  });
}

/*
 * Carga real del movimiento.
 *
 * El neto es la diferencia entre los dos pesajes del vehiculo. Cuando el
 * vehiculo entro sin trailer y salio con el, esa diferencia incluye el peso del
 * trailer y hay que descontarlo; de lo contrario la carga -y el VGM que sale de
 * ella- quedan infladas en el peso del trailer completo.
 */
function cargaReal({ neto, pesoTrailer: peso, recogeTrailer = false, noContenedor }) {
  const total = entero(neto);
  if (total === null) return null;

  // Movimiento normal: el neto es directamente lo que se cargo o descargo.
  if (!recogeTrailer) return total;

  // Recogiendo trailer sin contenedor, el trailer va vacio y no hay mercancia:
  // todo el neto es equipo. Restar el promedio dejaria una carga fantasma de
  // unas decenas de kilos, la mitad de la diferencia entre determinaciones.
  if (!hayContenedor(noContenedor)) return 0;

  const trailer = entero(peso);
  if (trailer === null) return null;

  const carga = total - trailer;
  return carga > 0 ? carga : 0;
}

/*
 * VGM - Verified Gross Mass, SOLAS capitulo VI regla 2.
 * Es la masa del contenedor lleno: tara del contenedor mas la carga que lleva.
 * No incluye el vehiculo ni el trailer.
 *
 * Sin numero de contenedor no hay nada que declarar y se devuelve null.
 */
function vgm({ taraContenedor, carga, noContenedor }) {
  if (!hayContenedor(noContenedor)) return null;
  const tara = entero(taraContenedor);
  const mercancia = entero(carga);
  if (tara === null || mercancia === null) return null;
  const total = tara + mercancia;
  return total > 0 ? total : null;
}

/*
 * Agrega los campos calculados a una fila leida de Trailers, para que el front
 * los consuma resueltos en vez de recalcularlos por su cuenta.
 */
function conCalculos(fila) {
  if (!fila) return fila;
  const promedio = pesoTrailer(fila);
  return {
    ...fila,
    Diferencia_Determinaciones: diferenciaDeterminaciones(fila),
    // Las filas anteriores a la migracion traen un Peso_Trailer calculado con
    // la formula recursiva vieja. Si hay determinaciones guardadas se devuelve
    // el valor correcto; si no, se respeta lo que haya en la fila.
    Peso_Trailer: promedio !== null ? promedio : fila.Peso_Trailer,
  };
}

module.exports = {
  entero,
  hayContenedor,
  determinar,
  pesoTrailer,
  diferenciaDeterminaciones,
  aplicarTaraVehiculo,
  aplicarSalida,
  cargaReal,
  vgm,
  conCalculos,
};
