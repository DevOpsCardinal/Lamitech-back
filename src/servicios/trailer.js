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
  hayContenedor,
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
async function registrarTaraVehiculo(pool, { trailer, taraVehiculo, noContenedor }) {
  if (!trailer) return null;

  const fila = await trailerAbierto(pool, trailer);
  if (!fila) return null;

  const resultado = aplicarTaraVehiculo(fila, {
    taraVehiculo,
    conCarga: hayContenedor(noContenedor),
  });

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
  noContenedor,
}) {
  if (!trailer) return null;

  const fila = await trailerAbierto(pool, trailer);
  if (!fila) return null;

  const resultado = aplicarSalida(fila, {
    placa,
    pesoConjunto: pesoConjuntoSalida,
    taraVehiculo: taraVehiculoSalida,
    conCarga: hayContenedor(noContenedor),
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

module.exports = {
  trailerAbierto,
  registrarTaraVehiculo,
  cerrarTrailer,
};
