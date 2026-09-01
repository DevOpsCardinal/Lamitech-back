/*
 * Movimientos de la tabla Trailers.
 *
 * La decision de que se guarda vive en calculos/pesos.js como funciones puras;
 * aqui solo se lee la fila abierta, se aplica el movimiento y se persiste el
 * resultado. Asi las pruebas de escenario ejercitan la misma logica que corre
 * en produccion, sin necesidad de base de datos.
 */

const { sql } = require('../database/connection');
const {
  aplicarTaraVehiculo,
  aplicarSalida,
  conCalculos,
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

function peticionDerivadas(pool, trailer, fila) {
  return pool
    .request()
    .input('Trailer', sql.VarChar, trailer)
    .input('taraCab1', sql.Int, fila.taraCab1 ?? null)
    .input('taraCab2', sql.Int, fila.taraCab2 ?? null)
    .input('Peso_Trailer_Entrada', sql.Int, fila.Peso_Trailer_Entrada ?? null)
    .input('Peso_Trailer_Salida', sql.Int, fila.Peso_Trailer_Salida ?? null)
    .input('Peso_Trailer', sql.Int, fila.Peso_Trailer ?? null)
    .input('Diferencia_Determinaciones', sql.Int, fila.Diferencia_Determinaciones ?? null);
}

const SET_DERIVADAS = `taraCab1             = @taraCab1,
                       taraCab2             = @taraCab2,
                       Peso_Trailer_Entrada = @Peso_Trailer_Entrada,
                       Peso_Trailer_Salida  = @Peso_Trailer_Salida,
                       Peso_Trailer         = @Peso_Trailer,
                       Diferencia_Determinaciones = @Diferencia_Determinaciones`;

/*
 * El vehiculo se peso solo, sin trailer.
 */
async function registrarTaraVehiculo(pool, { trailer, taraVehiculo }) {
  if (!trailer) return null;

  const fila = await trailerAbierto(pool, trailer);
  if (!fila) return null;

  const resultado = aplicarTaraVehiculo(fila, { taraVehiculo });

  await peticionDerivadas(pool, trailer, resultado)
    .query(`UPDATE Trailers SET ${SET_DERIVADAS} ${FILTRO_FILA}`);

  return resultado;
}

/*
 * El vehiculo se lleva el trailer: se cierra el viaje.
 */
async function cerrarTrailer(pool, {
  trailer,
  placa,
  pesoConjuntoSalida,
  taraVehiculoSalida,
}) {
  if (!trailer) return null;

  const fila = await trailerAbierto(pool, trailer);
  if (!fila) return null;

  const resultado = aplicarSalida(fila, {
    placa,
    pesoConjunto: pesoConjuntoSalida,
    taraVehiculo: taraVehiculoSalida,
  });

  await peticionDerivadas(pool, trailer, resultado)
    .input('Placa', sql.VarChar, placa)
    .input('Peso_Salida', sql.Int, resultado.Peso_Salida ?? null)
    .query(`UPDATE Trailers
               SET Fecha_Salida = FORMAT(GETDATE(), 'yyyy-MM-dd'),
                   Hora_Salida  = FORMAT(GETDATE(), 'HH:mm'),
                   Placa_Salida = @Placa,
                   Peso_Salida  = @Peso_Salida,
                   ${SET_DERIVADAS},
                   Culminado    = 1
             ${FILTRO_FILA}`);

  return resultado;
}

/*
 * Menor determinacion registrada para el trailer en viajes ya cerrados.
 *
 * Un trailer nunca pesa menos que vacio, asi que el minimo historico es la
 * mejor estimacion de su tara cuando el viaje en curso todavia no da una
 * determinacion limpia. Solo mira viajes culminados: la fila abierta puede
 * traer una unica determinacion contaminada por la mercancia.
 */
async function pesoTrailerHistorico(pool, trailer) {
  if (!trailer) return null;

  const resultado = await pool
    .request()
    .input('Trailer', sql.VarChar, trailer)
    .query(`SELECT MIN(determinacion) AS Peso
              FROM (SELECT Peso_Trailer_Entrada AS determinacion
                      FROM Trailers
                     WHERE Trailer = @Trailer AND Culminado = 1
                    UNION ALL
                    SELECT Peso_Trailer_Salida
                      FROM Trailers
                     WHERE Trailer = @Trailer AND Culminado = 1) AS d
             WHERE determinacion IS NOT NULL
               AND determinacion > 0`);

  return entero(resultado.recordset[0]?.Peso);
}

/*
 * Peso de trailer a descontar del neto de un movimiento.
 *
 * Al RECOGER, el viaje en curso ya trae la determinacion del extremo en que se
 * dejo el trailer, asi que sirve. Al DESCARGAR no: la unica determinacion del
 * viaje es la de este mismo movimiento, que incluye la mercancia, y hay que
 * recurrir al historico del trailer.
 *
 * Cuando hay las dos se toma la menor, que es la que mas se acerca al trailer
 * vacio.
 */
async function pesoTrailerParaCarga(pool, { trailer, usarViajeEnCurso }) {
  if (!trailer) return null;

  const historico = await pesoTrailerHistorico(pool, trailer);
  if (!usarViajeEnCurso) return historico;

  // conCalculos recalcula el promedio desde las determinaciones en vez de
  // confiar en la columna, que en filas viejas trae la formula recursiva.
  const fila = await trailerAbierto(pool, trailer);
  const enCurso = entero(conCalculos(fila)?.Peso_Trailer);

  if (enCurso === null) return historico;
  if (historico === null) return enCurso;
  return Math.min(enCurso, historico);
}

module.exports = {
  trailerAbierto,
  registrarTaraVehiculo,
  cerrarTrailer,
  pesoTrailerHistorico,
  pesoTrailerParaCarga,
};
