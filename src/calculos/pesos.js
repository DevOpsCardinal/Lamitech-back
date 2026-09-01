/*
 * Punto unico de calculo de peso de trailer y VGM.
 *
 * Toda la aplicacion debe pasar por aqui: tener la formula repetida en los
 * controladores y en los modales del front fue lo que permitio que el tiquete
 * original y su reimpresion mostraran cifras distintas.
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
 * Determinacion del peso del trailer usando el cabezote que lo trajo.
 * Peso_Entrada es el conjunto (cabezote + trailer) y taraCab1 el cabezote solo.
 */
function determinacionEntrada(trailer) {
  const conjunto = entero(trailer?.Peso_Entrada);
  const cabezote = entero(trailer?.taraCab1);
  if (conjunto === null || cabezote === null) return null;
  const peso = conjunto - cabezote;
  return peso > 0 ? peso : null;
}

/*
 * Determinacion del peso del trailer usando el cabezote que se lo lleva.
 */
function determinacionSalida(trailer) {
  const conjunto = entero(trailer?.Peso_Salida);
  const cabezote = entero(trailer?.taraCab2);
  if (conjunto === null || cabezote === null) return null;
  const peso = conjunto - cabezote;
  return peso > 0 ? peso : null;
}

/*
 * Peso del trailer independiente del cabezote: promedio de las dos
 * determinaciones del viaje. Con una sola disponible se devuelve esa, y
 * mientras no haya ninguna se devuelve null en vez de cero, para no publicar
 * un dato que todavia no se ha medido.
 */
function pesoTrailer(trailer) {
  const determinaciones = [
    determinacionEntrada(trailer),
    determinacionSalida(trailer),
  ].filter((valor) => valor !== null);

  if (determinaciones.length === 0) return null;

  const suma = determinaciones.reduce((total, valor) => total + valor, 0);
  return Math.round(suma / determinaciones.length);
}

/*
 * Diferencia absoluta entre las dos determinaciones. Solo tiene valor cuando
 * ambas existen. Se registra para poder fijar una tolerancia con datos reales;
 * hoy no bloquea ni alerta.
 */
function diferenciaDeterminaciones(trailer) {
  const entrada = determinacionEntrada(trailer);
  const salida = determinacionSalida(trailer);
  if (entrada === null || salida === null) return null;
  return Math.abs(entrada - salida);
}

/*
 * Hay contenedor cuando el movimiento trae numero de contenedor. Un trailer
 * que entra o sale vacio no lo tiene.
 */
function hayContenedor(noContenedor) {
  return String(noContenedor ?? '').trim() !== '';
}

/*
 * VGM - Verified Gross Mass, SOLAS capitulo VI regla 2.
 * Es la masa del contenedor lleno: tara del contenedor mas la carga que lleva.
 * No incluye cabezote ni trailer.
 *
 * Sin numero de contenedor no hay nada que declarar y se devuelve null. Antes
 * se emitia un VGM tambien en los movimientos de trailer vacio, donde la tara
 * del contenedor llega en cero y el resultado terminaba siendo el peso del
 * trailer presentado como masa declarada.
 */
function vgm({ taraContenedor, neto, noContenedor }) {
  if (!hayContenedor(noContenedor)) return null;
  const tara = entero(taraContenedor);
  const carga = entero(neto);
  if (tara === null || carga === null) return null;
  const total = tara + carga;
  return total > 0 ? total : null;
}

/*
 * Agrega los campos calculados a una fila de Trailers para que el front los
 * consuma ya resueltos en vez de recalcularlos por su cuenta.
 */
function conCalculos(trailer) {
  if (!trailer) return trailer;
  const promedio = pesoTrailer(trailer);
  return {
    ...trailer,
    Peso_Trailer_Entrada: determinacionEntrada(trailer),
    Peso_Trailer_Salida: determinacionSalida(trailer),
    Diferencia_Determinaciones: diferenciaDeterminaciones(trailer),
    // Las filas anteriores a la migracion traen un Peso_Trailer calculado con
    // la formula recursiva vieja. Si se puede recalcular a partir de los pesos
    // originales se devuelve el valor correcto; si no, se respeta el guardado.
    Peso_Trailer: promedio !== null ? promedio : trailer.Peso_Trailer,
  };
}

module.exports = {
  entero,
  hayContenedor,
  determinacionEntrada,
  determinacionSalida,
  pesoTrailer,
  diferenciaDeterminaciones,
  vgm,
  conCalculos,
};
