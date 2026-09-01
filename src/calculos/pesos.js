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
 * Tolerancia entre las dos determinaciones de un mismo viaje, en kilos.
 *
 * Por debajo de este valor la diferencia se atribuye a la repetibilidad de la
 * bascula y se toma que el trailer viajo vacio en los dos extremos. Por encima
 * se atribuye a mercancia real.
 *
 * 200 kg queda muy por encima del ruido observado entre dos pesajes del mismo
 * conjunto (del orden de decenas de kilos) y muy por debajo de cualquier carga
 * de las que se han visto en operacion (870 y 1400 kg en las pruebas). Si
 * llegara a despacharse mercancia por debajo de 200 kg hay que bajarlo, porque
 * se contaria como trailer vacio. Es el unico numero de este modulo que no sale
 * de una medicion: cambiarlo aqui lo cambia en todo el sistema.
 */
const TOLERANCIA_KG = 200;

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
 * Hay contenedor cuando el movimiento trae numero de contenedor o cuando el
 * operario digito su tara. La tara la lee del costado del contenedor, asi que
 * escribirla ya es declarar que hay uno.
 *
 * Ojo: esto decide UNICAMENTE si se emite VGM. NO decide si el trailer va
 * cargado. Usar el mismo campo para las dos preguntas fue el error que dejaba
 * el tiquete en blanco: sin numero de contenedor se daba por vacio un trailer
 * que llevaba 1400 kg, y con el numero escrito en los dos pesajes se daba por
 * cargado siempre y no se podia determinar nada.
 */
function hayContenedor(noContenedor) {
  return String(noContenedor ?? '').trim() !== '';
}

function hayDeclaracionContenedor({ noContenedor, taraContenedor }) {
  if (hayContenedor(noContenedor)) return true;
  const tara = entero(taraContenedor);
  return tara !== null && tara > 0;
}

/*
 * Peso despejado de un pesaje: el conjunto menos el vehiculo solo.
 *
 * Se guarda siempre en crudo, sin juzgar si el trailer iba vacio o cargado. Si
 * iba cargado esta cifra es trailer + mercancia; cual de los dos extremos es
 * cual se resuelve mas abajo comparandolos, que es la unica forma de saberlo:
 * un solo pesaje no puede separar trailer de mercancia.
 */
function determinar({ conjunto, taraVehiculo }) {
  const total = entero(conjunto);
  const vehiculo = entero(taraVehiculo);
  if (total === null || vehiculo === null) return null;
  const peso = total - vehiculo;
  return peso > 0 ? peso : null;
}

function determinacionesDe(fila) {
  return {
    entrada: entero(fila?.Peso_Trailer_Entrada),
    salida: entero(fila?.Peso_Trailer_Salida),
  };
}

/*
 * Peso del trailer, independiente de los vehiculos que lo movieron.
 *
 * Con las dos determinaciones:
 *   - si concuerdan dentro de la tolerancia, el trailer viajo vacio en los dos
 *     extremos y se promedian, que es lo que reduce el error de bascula;
 *   - si difieren mas que eso, uno de los extremos llevaba mercancia. El
 *     trailer vacio es el MENOR: un trailer nunca pesa menos que vacio, y lo
 *     que sobra en el otro extremo es la carga.
 *
 * Con una sola determinacion se devuelve esa, aunque pueda venir contaminada:
 * no hay contra que compararla todavia.
 */
function pesoTrailer(fila, { tolerancia = TOLERANCIA_KG } = {}) {
  const { entrada, salida } = determinacionesDe(fila);
  if (entrada === null && salida === null) return null;
  if (entrada === null) return salida;
  if (salida === null) return entrada;
  if (Math.abs(entrada - salida) <= tolerancia) {
    return Math.round((entrada + salida) / 2);
  }
  return Math.min(entrada, salida);
}

/*
 * Cual de los dos extremos llevaba mercancia, o null si concuerdan.
 * Se expone para que el front pueda explicar por que el promedio no se aplico.
 */
function extremoCargado(fila, { tolerancia = TOLERANCIA_KG } = {}) {
  const { entrada, salida } = determinacionesDe(fila);
  if (entrada === null || salida === null) return null;
  if (Math.abs(entrada - salida) <= tolerancia) return null;
  return entrada > salida ? 'Entrada' : 'Salida';
}

/*
 * Diferencia absoluta entre las dos determinaciones. Solo tiene valor cuando
 * ambas existen. Sirve para revisar con datos reales si la tolerancia elegida
 * es la correcta; no bloquea ni alerta.
 */
function diferenciaDeterminaciones(fila) {
  const { entrada, salida } = determinacionesDe(fila);
  if (entrada === null || salida === null) return null;
  return Math.abs(entrada - salida);
}

/* Recalcula las columnas derivadas de una fila. */
function conDerivadas(fila, opciones) {
  return {
    ...fila,
    Peso_Trailer: pesoTrailer(fila, opciones),
    Diferencia_Determinaciones: diferenciaDeterminaciones(fila),
  };
}

/*
 * El vehiculo se peso solo, sin trailer. Su tara alimenta la determinacion de
 * entrada si es el que lo trajo (taraCab1 aun vacia) o la de salida si es el
 * que se lo va a llevar.
 */
function aplicarTaraVehiculo(fila, { taraVehiculo, tolerancia }) {
  const tara = entero(taraVehiculo);
  if (tara === null) return fila;

  const esPrimerVehiculo = entero(fila.taraCab1) === null;

  if (esPrimerVehiculo) {
    return conDerivadas(
      {
        ...fila,
        taraCab1: tara,
        Peso_Trailer_Entrada: determinar({
          conjunto: fila.Peso_Entrada,
          taraVehiculo: tara,
        }),
      },
      { tolerancia }
    );
  }

  return conDerivadas(
    {
      ...fila,
      taraCab2: tara,
      Peso_Trailer_Salida: determinar({
        conjunto: fila.Peso_Salida,
        taraVehiculo: tara,
      }),
    },
    { tolerancia }
  );
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
function aplicarSalida(fila, { placa, pesoConjunto, taraVehiculo, tolerancia }) {
  const conjunto = entero(pesoConjunto);
  const tara = entero(taraVehiculo) ?? entero(fila.taraCab2);

  return conDerivadas(
    {
      ...fila,
      Placa_Salida: placa,
      Peso_Salida: conjunto,
      taraCab2: tara,
      Peso_Trailer_Salida: determinar({ conjunto, taraVehiculo: tara }),
      Culminado: true,
    },
    { tolerancia }
  );
}

/*
 * Carga real del movimiento.
 *
 * El neto es la diferencia entre los dos pesajes del vehiculo. Cuando el
 * trailer solo esta presente en UNO de los dos pesajes -el vehiculo entra sin
 * el y sale con el, o al reves- ese neto incluye el peso del trailer y hay que
 * descontarlo; de lo contrario la carga, y el VGM que sale de ella, quedan
 * infladas en el trailer completo.
 *
 * Si en ese caso el peso del trailer todavia no se conoce, la carga es
 * indeterminable y se devuelve null. Es preferible un tiquete en blanco a un
 * VGM inventado: el VGM es una declaracion legal.
 */
function cargaReal({ neto, pesoTrailer: peso, incluyeTrailer = false, tolerancia = TOLERANCIA_KG }) {
  const total = entero(neto);
  if (total === null) return null;

  // Movimiento normal: el neto es directamente lo que se cargo o descargo.
  if (!incluyeTrailer) return total;

  const trailer = entero(peso);
  if (trailer === null) return null;

  const carga = total - trailer;

  // Dentro de la tolerancia el trailer viajo vacio: la diferencia es ruido de
  // bascula, no mercancia. Sin esto quedaba una carga fantasma de unas decenas
  // de kilos y el tiquete declaraba un VGM que no existia.
  if (Math.abs(carga) <= tolerancia) return 0;

  return carga > 0 ? carga : 0;
}

/*
 * VGM - Verified Gross Mass, SOLAS capitulo VI regla 2.
 * Es la masa del contenedor lleno: tara del contenedor mas la carga que lleva.
 * No incluye el vehiculo ni el trailer.
 *
 * Sin contenedor declarado no hay nada que declarar y se devuelve null: un
 * despacho nacional sobre planchon no tiene VGM, y un campo vacio es correcto
 * donde un 0 seguiria siendo una declaracion.
 */
function vgm({ taraContenedor, carga, noContenedor }) {
  if (!hayDeclaracionContenedor({ noContenedor, taraContenedor })) return null;
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
  const calculado = pesoTrailer(fila);
  return {
    ...fila,
    Diferencia_Determinaciones: diferenciaDeterminaciones(fila),
    Extremo_Cargado: extremoCargado(fila),
    // Las filas anteriores a la migracion traen un Peso_Trailer calculado con
    // la formula recursiva vieja. Si hay determinaciones guardadas se devuelve
    // el valor correcto; si no, se respeta lo que haya en la fila.
    Peso_Trailer: calculado !== null ? calculado : fila.Peso_Trailer,
  };
}

module.exports = {
  TOLERANCIA_KG,
  entero,
  hayContenedor,
  hayDeclaracionContenedor,
  determinar,
  pesoTrailer,
  extremoCargado,
  diferenciaDeterminaciones,
  aplicarTaraVehiculo,
  aplicarSalida,
  cargaReal,
  vgm,
  conCalculos,
};
