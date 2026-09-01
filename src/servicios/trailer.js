/*
 * Movimientos de la tabla Trailers.
 *
 * Antes esta logica estaba duplicada y divergente en despachos.controller.js y
 * en ingresos.controller.js: una rama usaba la tara recien pesada y la otra la
 * guardada en base, de modo que el mismo trailer daba un peso distinto segun
 * por donde entrara el movimiento. Ahora ambas rutas llaman aqui.
 */

const { sql } = require('../database/connection');
const {
  determinacionEntrada,
  determinacionSalida,
  pesoTrailer,
  diferenciaDeterminaciones,
  entero,
} = require('../calculos/pesos');

/*
 * Ultima fila sin culminar del trailer. Devuelve null si no hay ninguna
 * abierta, para que el llamador no toque un viaje ya cerrado.
 */
async function trailerAbierto(pool, trailer) {
  const resultado = await pool
    .request()
    .input('Trailer', sql.VarChar, trailer)
    .query(`SELECT TOP 1 *
              FROM Trailers
             WHERE Trailer = @Trailer
             ORDER BY Fecha_Entrada DESC, Hora_Entrada DESC`);

  const fila = resultado.recordset[0];
  if (!fila) return null;
  if (fila.Culminado == true) return null;
  return fila;
}

/*
 * Acota el UPDATE a la fila leida. Con solo "Trailer = X AND Culminado = 0" un
 * trailer con filas abiertas duplicadas recibiria el update en todas.
 */
function peticionSobreFila(pool, trailer) {
  return pool.request().input('Trailer', sql.VarChar, trailer);
}

/*
 * Acota el UPDATE a la fila abierta mas reciente. La fecha se resuelve dentro
 * del propio SQL en vez de viajar como parametro: Fecha_Entrada puede ser DATE
 * o VARCHAR segun como este declarada la tabla, y pasarla tipada rompia el
 * movimiento con "Validation failed for parameter. Invalid string". CONCAT la
 * normaliza a texto sea cual sea su tipo.
 */
const FILTRO_FILA = `WHERE Trailer = @Trailer
                       AND Culminado = 0
                       AND CONCAT(Fecha_Entrada, ' ', Hora_Entrada) =
                           (SELECT MAX(CONCAT(Fecha_Entrada, ' ', Hora_Entrada))
                              FROM Trailers
                             WHERE Trailer = @Trailer
                               AND Culminado = 0)`;

/*
 * Campos derivados a partir de como quedaria la fila tras el movimiento.
 * Peso_Trailer pasa a ser el promedio de las determinaciones disponibles.
 */
function derivados(filaProyectada) {
  return {
    entrada: determinacionEntrada(filaProyectada),
    salida: determinacionSalida(filaProyectada),
    promedio: pesoTrailer(filaProyectada),
    diferencia: diferenciaDeterminaciones(filaProyectada),
  };
}

function conDerivados(peticion, calculo) {
  return peticion
    .input('Peso_Trailer_Entrada', sql.Int, calculo.entrada)
    .input('Peso_Trailer_Salida', sql.Int, calculo.salida)
    .input('Peso_Trailer', sql.Int, calculo.promedio)
    .input('Diferencia_Determinaciones', sql.Int, calculo.diferencia);
}

const SET_DERIVADOS = `Peso_Trailer_Entrada = @Peso_Trailer_Entrada,
                       Peso_Trailer_Salida  = @Peso_Trailer_Salida,
                       Peso_Trailer         = @Peso_Trailer,
                       Diferencia_Determinaciones = @Diferencia_Determinaciones`;

/*
 * El cabezote se peso solo, sin trailer. Su tara alimenta la determinacion de
 * entrada si es el que lo trajo (taraCab1 aun vacia) o la de salida si es el
 * que se lo va a llevar (taraCab2).
 */
async function registrarTaraCabezote(pool, { trailer, taraCabezote }) {
  const tara = entero(taraCabezote);
  if (!trailer || tara === null) return null;

  const fila = await trailerAbierto(pool, trailer);
  if (!fila) return null;

  const esPrimerCabezote = entero(fila.taraCab1) === null;
  const columna = esPrimerCabezote ? 'taraCab1' : 'taraCab2';

  const calculo = derivados({ ...fila, [columna]: tara });

  await conDerivados(peticionSobreFila(pool, trailer), calculo)
    .input('Tara', sql.Int, tara)
    .query(`UPDATE Trailers
               SET ${columna} = @Tara,
                   ${SET_DERIVADOS}
             ${FILTRO_FILA}`);

  return { columna, ...calculo };
}

/*
 * El cabezote se lleva el trailer: se registra el peso del conjunto a la salida
 * y se cierra el viaje. taraCab2 NO se toca aqui, viene del pesaje del cabezote
 * solo; sobrescribirla con el peso del conjunto (lo que se hacia antes) dejaba
 * la determinacion de salida en cero.
 */
async function cerrarTrailer(pool, { trailer, placa, pesoConjuntoSalida }) {
  if (!trailer) return null;

  const fila = await trailerAbierto(pool, trailer);
  if (!fila) return null;

  const pesoSalida = entero(pesoConjuntoSalida);
  const calculo = derivados({ ...fila, Peso_Salida: pesoSalida });

  await conDerivados(peticionSobreFila(pool, trailer), calculo)
    .input('Placa', sql.VarChar, placa)
    .input('Peso_Salida', sql.Int, pesoSalida)
    .query(`UPDATE Trailers
               SET Fecha_Salida = FORMAT(GETDATE(), 'yyyy-MM-dd'),
                   Hora_Salida  = FORMAT(GETDATE(), 'HH:mm'),
                   Placa_Salida = @Placa,
                   Peso_Salida  = @Peso_Salida,
                   ${SET_DERIVADOS},
                   Culminado    = 1
             ${FILTRO_FILA}`);

  return calculo;
}

module.exports = {
  trailerAbierto,
  registrarTaraCabezote,
  cerrarTrailer,
};
