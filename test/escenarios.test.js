/*
 * Escenarios de ciclo completo de trailer, sin base de datos.
 *
 * Encadenan las mismas funciones puras que corren en produccion
 * (calculos/pesos.js) en el mismo orden en que las llama servicios/trailer.js,
 * asi que reproducen el tiquete que saldria impreso.
 *
 * Los escenarios 1 y 2 son los dos juegos de tiquetes que se imprimieron en
 * planta y salieron mal: son la prueba de que el arreglo los corrige.
 */

const assert = require('assert');
const {
  aplicarTaraVehiculo,
  aplicarSalida,
  cargaReal,
  vgm,
  conCalculos,
  entero,
} = require('../src/calculos/pesos');

let corridas = 0;
function comprobar(descripcion, real, esperado) {
  corridas += 1;
  assert.deepStrictEqual(real, esperado, `${descripcion}: se esperaba ${JSON.stringify(esperado)} y llego ${JSON.stringify(real)}`);
}

/* ------------------------------------------------------------------------ */
/* Patio en memoria: reproduce lo que hace servicios/trailer.js contra la BD. */
/* ------------------------------------------------------------------------ */

function nuevoPatio() {
  return { abierta: null, cerradas: [] };
}

/* transito.controller: primer pesaje, se crea la fila del trailer. */
function entraTrailer(patio, { trailer, placa, pesoEntrada }) {
  patio.abierta = {
    Trailer: trailer,
    Placa_Entrada: placa,
    Peso_Entrada: entero(pesoEntrada),
    taraCab1: null,
    taraCab2: null,
    Peso_Trailer_Entrada: null,
    Peso_Trailer_Salida: null,
    Peso_Trailer: null,
    Culminado: false,
  };
  return patio.abierta;
}

/* servicios/trailer.js: registrarTaraVehiculo */
function pesaVehiculoSolo(patio, { taraVehiculo }) {
  patio.abierta = aplicarTaraVehiculo(patio.abierta, { taraVehiculo });
  return patio.abierta;
}

/* servicios/trailer.js: cerrarTrailer */
function saleConTrailer(patio, { placa, pesoConjunto, taraVehiculo }) {
  patio.abierta = aplicarSalida(patio.abierta, { placa, pesoConjunto, taraVehiculo });
  patio.cerradas.push(patio.abierta);
  const cerrada = patio.abierta;
  patio.abierta = null;
  return cerrada;
}

/* servicios/trailer.js: pesoTrailerHistorico */
function historico(patio) {
  const determinaciones = patio.cerradas
    .flatMap((fila) => [fila.Peso_Trailer_Entrada, fila.Peso_Trailer_Salida])
    .map(entero)
    .filter((valor) => valor !== null && valor > 0);
  return determinaciones.length ? Math.min(...determinaciones) : null;
}

/* servicios/trailer.js: pesoTrailerParaCarga */
function pesoParaCarga(patio, { usarViajeEnCurso }) {
  const previo = historico(patio);
  if (!usarViajeEnCurso) return previo;
  const enCurso = entero(conCalculos(patio.abierta)?.Peso_Trailer);
  if (enCurso === null) return previo;
  if (previo === null) return enCurso;
  return Math.min(enCurso, previo);
}

/*
 * despachos/ingresos.controller: lo que queda impreso en el tiquete.
 * recoger = el vehiculo se lleva el trailer; descargar = lo deja.
 */
function emitirTiquete(patio, { neto, taraContenedor, noContenedor, recoger = false, descargar = false }) {
  const incluyeTrailer = recoger || descargar;
  const peso = incluyeTrailer ? pesoParaCarga(patio, { usarViajeEnCurso: recoger }) : null;
  const carga = cargaReal({ neto, pesoTrailer: peso, incluyeTrailer });
  return { Carga: carga, Vgm: vgm({ taraContenedor, carga, noContenedor }) };
}

/* ==================================================================== */
console.log('\n1. Tiquetes 34321 y 37106 (foto prueba1: contenedor nunca digitado)');
/* ==================================================================== */
{
  // ABC entra con el trailer, lo deja y sale solo. 6220 con trailer, 5370 solo.
  const patio = nuevoPatio();
  entraTrailer(patio, { trailer: 'R-1', placa: 'AAA111', pesoEntrada: 6220 });
  pesaVehiculoSolo(patio, { taraVehiculo: 5370 });

  comprobar('determinacion de entrada', patio.abierta.Peso_Trailer_Entrada, 850);

  // Ese mismo vehiculo vuelve, entra solo (5440) y sale con el trailer cargado
  // con 1400 kg de producto (7690). Nunca se digito numero de contenedor.
  const carga = emitirTiquete(patio, {
    neto: 7690 - 5440,
    taraContenedor: 20,
    noContenedor: '',
    recoger: true,
  });

  const cerrada = saleConTrailer(patio, { placa: 'AAA111', pesoConjunto: 7690, taraVehiculo: 5440 });

  // Antes imprimia 1550: el promedio de 850 con una determinacion cargada.
  comprobar('PESO TRAILER ya no promedia el extremo cargado', conCalculos(cerrada).Peso_Trailer, 850);
  comprobar('detecta que la carga iba a la salida', conCalculos(cerrada).Extremo_Cargado, 'Salida');
  comprobar('CARGA deja de salir en blanco', carga.Carga, 1400);
  comprobar('VGM sale con la tara digitada aunque falte el numero', carga.Vgm, 1420);
}

/* ==================================================================== */
console.log('2. Tiquetes 34323 y 37108 (foto prueba2: contenedor digitado siempre)');
/* ==================================================================== */
{
  // AAA222 entra con el trailer 12345 (6760) y sale solo (5360).
  const patio = nuevoPatio();
  entraTrailer(patio, { trailer: '12345', placa: 'AAA222', pesoEntrada: 6760 });

  // El ingreso no se marco como descargar trailer, asi que su neto se toma
  // completo. Con contenedor 'PRUEBA' declarado, el VGM se emite.
  const ingreso = emitirTiquete(patio, { neto: 6760 - 5360, taraContenedor: 20, noContenedor: 'PRUEBA' });
  comprobar('el ingreso declara su carga', ingreso.Carga, 1400);
  comprobar('el ingreso ya muestra VGM', ingreso.Vgm, 1420);

  pesaVehiculoSolo(patio, { taraVehiculo: 5360 });
  // Antes quedaba en null porque el contenedor la marcaba como cargada.
  comprobar('la determinacion de entrada ya no se descarta', patio.abierta.Peso_Trailer_Entrada, 1400);

  // Vuelve, entra solo (5430) y sale con el trailer (7700).
  const despacho = emitirTiquete(patio, {
    neto: 7700 - 5430,
    taraContenedor: 20,
    noContenedor: 'PRUEBA',
    recoger: true,
  });
  const cerrada = saleConTrailer(patio, { placa: 'AAA222', pesoConjunto: 7700, taraVehiculo: 5430 });

  // Antes los tres salian en blanco: las dos determinaciones se descartaban.
  comprobar('PESO TRAILER deja de salir en blanco', conCalculos(cerrada).Peso_Trailer, 1400);
  comprobar('CARGA deja de salir en blanco', despacho.Carga, 870);
  comprobar('VGM DEFINITIVO deja de salir en blanco', despacho.Vgm, 890);
}

/* ==================================================================== */
console.log('3. Trailer vacio en los dos extremos: se promedia y no hay carga');
/* ==================================================================== */
{
  const patio = nuevoPatio();
  entraTrailer(patio, { trailer: 'R-3', placa: 'ABC-101', pesoEntrada: 18000 });
  pesaVehiculoSolo(patio, { taraVehiculo: 7000 });
  comprobar('determinacion de entrada', patio.abierta.Peso_Trailer_Entrada, 11000);

  const tiquete = emitirTiquete(patio, {
    neto: 18100 - 7050,
    taraContenedor: 0,
    noContenedor: '',
    recoger: true,
  });
  const cerrada = saleConTrailer(patio, { placa: 'XYZ-202', pesoConjunto: 18100, taraVehiculo: 7050 });

  comprobar('las dos determinaciones concuerdan y se promedian', conCalculos(cerrada).Peso_Trailer, 11025);
  comprobar('ningun extremo iba cargado', conCalculos(cerrada).Extremo_Cargado, null);
  comprobar('el residuo de bascula no se declara como carga', tiquete.Carga, 0);
  comprobar('sin contenedor no se declara VGM', tiquete.Vgm, null);
}

/* ==================================================================== */
console.log('4. Exportacion: entra vacio, se carga en planta y sale lleno');
/* ==================================================================== */
{
  const patio = nuevoPatio();
  entraTrailer(patio, { trailer: 'R-4', placa: 'ABC-101', pesoEntrada: 18000 });
  pesaVehiculoSolo(patio, { taraVehiculo: 7000 });

  // Se le montan 22.000 kg. Sale un tractor de 7.000 con el conjunto en 40.000.
  const tiquete = emitirTiquete(patio, {
    neto: 40000 - 7000,
    taraContenedor: 4000,
    noContenedor: 'MSCU1234567',
    recoger: true,
  });
  const cerrada = saleConTrailer(patio, { placa: 'XYZ-202', pesoConjunto: 40000, taraVehiculo: 7000 });

  comprobar('el trailer es la determinacion vacia', conCalculos(cerrada).Peso_Trailer, 11000);
  comprobar('la carga sale del descuento del trailer', tiquete.Carga, 22000);
  comprobar('VGM = tara contenedor + carga', tiquete.Vgm, 26000);
  // Antes se declaraba 37.000: tara + neto crudo, inflado en el trailer entero.
  comprobar('el VGM no incluye el trailer', tiquete.Vgm, 4000 + (33000 - 11000));
}

/* ==================================================================== */
console.log('5. Segundo ciclo: el trailer ya tiene historia y el ingreso puede declarar');
/* ==================================================================== */
{
  const patio = nuevoPatio();
  // Primer ciclo, igual al escenario 2: deja el trailer determinado en 1400.
  entraTrailer(patio, { trailer: '12345', placa: 'AAA222', pesoEntrada: 6760 });
  pesaVehiculoSolo(patio, { taraVehiculo: 5360 });
  saleConTrailer(patio, { placa: 'AAA222', pesoConjunto: 7700, taraVehiculo: 5430 });
  comprobar('el historico del trailer queda en su determinacion vacia', historico(patio), 1400);

  // Segundo ciclo: llega cargado y se marca DESCARGAR trailer. El neto incluye
  // el trailer, y ahora si se puede descontar con el historico.
  entraTrailer(patio, { trailer: '12345', placa: 'BBB333', pesoEntrada: 8000 });
  const ingreso = emitirTiquete(patio, {
    neto: 8000 - 5000,
    taraContenedor: 20,
    noContenedor: 'MSCU1234567',
    descargar: true,
  });
  comprobar('descargar trailer descuenta el trailer del neto', ingreso.Carga, 1600);
  comprobar('y el VGM sale sobre la carga real', ingreso.Vgm, 1620);

  // El mismo movimiento alimenta la determinacion de entrada del viaje nuevo.
  pesaVehiculoSolo(patio, { taraVehiculo: 5000 });
  comprobar('descargar deja determinado el extremo de entrada', patio.abierta.Peso_Trailer_Entrada, 3000);
}

/* ==================================================================== */
console.log('6. Drop and hook completo: un vehiculo lo deja, otro se lo lleva cargado');
/* ==================================================================== */
{
  const patio = nuevoPatio();

  // ABC-101 entra con el trailer vacio (18.000) y se marca DESCARGAR TRAILER.
  entraTrailer(patio, { trailer: 'R-8', placa: 'ABC-101', pesoEntrada: 18000 });
  const ingreso = emitirTiquete(patio, {
    neto: 18000 - 7000,
    taraContenedor: 4000,
    noContenedor: 'MSCU1234567',
    descargar: true,
  });
  comprobar('trailer sin historia: el ingreso no puede declarar carga', ingreso.Carga, null);
  comprobar('ni VGM', ingreso.Vgm, null);

  // Antes esta rama no registraba nada y el extremo quedaba sin determinar.
  pesaVehiculoSolo(patio, { taraVehiculo: 7000 });
  comprobar('descargar determina el extremo de entrada', patio.abierta.Peso_Trailer_Entrada, 11000);

  // Se le montan 22.000 kg. XYZ-202 entra solo (7.000) y sale con todo (40.000).
  const despacho = emitirTiquete(patio, {
    neto: 40000 - 7000,
    taraContenedor: 4000,
    noContenedor: 'MSCU1234567',
    recoger: true,
  });
  const cerrada = saleConTrailer(patio, { placa: 'XYZ-202', pesoConjunto: 40000, taraVehiculo: 7000 });

  comprobar('el trailer queda en su determinacion vacia', conCalculos(cerrada).Peso_Trailer, 11000);
  comprobar('la carga es la mercancia, sin el trailer', despacho.Carga, 22000);
  comprobar('y el VGM es tara contenedor + carga', despacho.Vgm, 26000);
}

/* ==================================================================== */
console.log('7. Trailer nuevo que llega cargado: no se puede declarar todavia');
/* ==================================================================== */
{
  const patio = nuevoPatio();
  // Trailer de 3.000 kg que llega con 1.600 kg de mercancia: el conjunto marca
  // 9.600 y el vehiculo solo 5.000.
  entraTrailer(patio, { trailer: 'R-6', placa: 'BBB333', pesoEntrada: 9600 });

  // Sin historia del trailer, el neto es trailer + mercancia y no hay forma de
  // separarlos. Se prefiere el tiquete en blanco a un VGM inventado.
  const ingreso = emitirTiquete(patio, {
    neto: 9600 - 5000,
    taraContenedor: 20,
    noContenedor: 'MSCU1234567',
    descargar: true,
  });
  comprobar('carga indeterminable', ingreso.Carga, null);
  comprobar('sin carga no se declara VGM', ingreso.Vgm, null);

  // Al cerrarse el ciclo el trailer si queda determinado para la proxima vez.
  pesaVehiculoSolo(patio, { taraVehiculo: 5000 });
  const cerrada = saleConTrailer(patio, { placa: 'CCC444', pesoConjunto: 12000, taraVehiculo: 9000 });
  comprobar('el extremo vacio es el de salida', conCalculos(cerrada).Extremo_Cargado, 'Entrada');
  comprobar('y el trailer queda determinado en el extremo vacio', conCalculos(cerrada).Peso_Trailer, 3000);
}

/* ==================================================================== */
console.log('8. Casos degenerados');
/* ==================================================================== */
{
  const patio = nuevoPatio();
  entraTrailer(patio, { trailer: 'R-7', placa: 'ABC-101', pesoEntrada: null });
  pesaVehiculoSolo(patio, { taraVehiculo: 7000 });
  comprobar('sin peso de entrada no hay determinacion', patio.abierta.Peso_Trailer_Entrada, null);
  comprobar('y el peso del trailer queda sin definir', patio.abierta.Peso_Trailer, null);

  const tiquete = emitirTiquete(patio, {
    neto: 11000,
    taraContenedor: 4000,
    noContenedor: 'MSCU1234567',
    recoger: true,
  });
  comprobar('sin trailer conocido la carga es indeterminable', tiquete.Carga, null);
  comprobar('y no se declara VGM', tiquete.Vgm, null);
}

console.log(`\nescenarios.test.js: ${corridas} verificaciones, todas pasaron`);
