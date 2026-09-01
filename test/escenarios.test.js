/*
 * Escenarios de punta a punta del ciclo de trailer.
 *
 * Encadenan los movimientos reales usando las mismas funciones que corren en
 * produccion (calculos/pesos.js, las que invoca servicios/trailer.js), de modo
 * que reproducen un ciclo completo sin base de datos ni bascula.
 */

const {
  aplicarTaraVehiculo,
  aplicarSalida,
  cargaReal,
  vgm,
} = require('../src/calculos/pesos');

let pasadas = 0;
const fallas = [];

function verificar(descripcion, obtenido, esperado) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (ok) {
    pasadas++;
    console.log(`  ok    ${descripcion}`);
  } else {
    fallas.push(descripcion);
    console.log(`  FALLA ${descripcion}`);
    console.log(`        esperado: ${JSON.stringify(esperado)}`);
    console.log(`        obtenido: ${JSON.stringify(obtenido)}`);
  }
}

/* Fila recien creada por transito.controller.js al dejar el trailer. */
function filaNueva({ trailer, placaEntrada, pesoEntrada, taraContenedor }) {
  return {
    Trailer: trailer,
    Placa_Entrada: placaEntrada,
    Peso_Entrada: pesoEntrada,
    Gross_Entrada: taraContenedor,
    Placa_Salida: '',
    Peso_Salida: 0,
    Peso_Trailer: null,
    Peso_Trailer_Entrada: null,
    Peso_Trailer_Salida: null,
    Diferencia_Determinaciones: null,
    taraCab1: null,
    taraCab2: null,
    Culminado: false,
  };
}

/* =================================================================== */
console.log('\nESCENARIO 1 · Trailer vacio en los dos extremos');
console.log('  A lo deja vacio, B se lo lleva vacio. Sin contenedor.\n');
{
  // Vehiculo A: 7.000 · Vehiculo B: 7.500 · Trailer vacio: ~11.000
  let fila = filaNueva({
    trailer: 'R-QA-01',
    placaEntrada: 'ABC-101',
    pesoEntrada: 18000,   // A + trailer vacio
    taraContenedor: 0,
  });

  // Paso 2: A sale solo. Sin contenedor -> el trailer venia vacio.
  fila = aplicarTaraVehiculo(fila, { taraVehiculo: 7000, conCarga: false });
  verificar('paso 2 · taraCab1', fila.taraCab1, 7000);
  verificar('paso 2 · determinacion de entrada', fila.Peso_Trailer_Entrada, 11000);
  verificar('paso 2 · peso del trailer con una sola determinacion', fila.Peso_Trailer, 11000);

  // Paso 5: B sale con el trailer vacio.
  fila = aplicarSalida(fila, {
    placa: 'XYZ-201',
    pesoConjunto: 18600,  // B + trailer vacio
    taraVehiculo: 7500,
    conCarga: false,
  });
  verificar('paso 5 · determinacion de salida', fila.Peso_Trailer_Salida, 11100);
  verificar('paso 5 · PESO TRAILER es el promedio', fila.Peso_Trailer, 11050);
  verificar('paso 5 · diferencia entre determinaciones', fila.Diferencia_Determinaciones, 100);
  verificar('paso 5 · viaje culminado', fila.Culminado, true);

  // Tiquete: movimiento sin contenedor.
  const neto = 18600 - 7500;
  const carga = cargaReal({ neto, pesoTrailer: fila.Peso_Trailer, recogeTrailer: true, noContenedor: '' });
  verificar('tiquete · carga real (trailer vacio)', carga, 0);
  verificar('tiquete · sin contenedor no se declara VGM',
    vgm({ taraContenedor: 0, carga, noContenedor: '' }), null);
}

/* =================================================================== */
console.log('\nESCENARIO 2 · Se carga en planta y sale lleno (exportacion)');
console.log('  A lo deja vacio, la planta carga 22.000, B se lo lleva lleno.\n');
{
  let fila = filaNueva({
    trailer: 'R-QA-04',
    placaEntrada: 'ABC-104',
    pesoEntrada: 18000,   // A + trailer vacio
    taraContenedor: 4000,
  });

  // Paso 2: A sale solo, el trailer entro vacio.
  fila = aplicarTaraVehiculo(fila, { taraVehiculo: 7000, conCarga: false });
  verificar('paso 2 · determinacion de entrada (trailer vacio)', fila.Peso_Trailer_Entrada, 11000);

  // Paso 5: B sale con el trailer CARGADO. 7.500 + 11.000 + 22.000
  fila = aplicarSalida(fila, {
    placa: 'XYZ-204',
    pesoConjunto: 40500,
    taraVehiculo: 7500,
    conCarga: true,       // lleva contenedor con mercancia
  });

  verificar('paso 5 · el extremo cargado no aporta determinacion',
    fila.Peso_Trailer_Salida, null);
  verificar('paso 5 · PESO TRAILER se mantiene en el del extremo vacio',
    fila.Peso_Trailer, 11000);
  verificar('paso 5 · sin dos determinaciones no hay diferencia',
    fila.Diferencia_Determinaciones, null);
  verificar('paso 5 · peso de salida se registra igual', fila.Peso_Salida, 40500);

  // Tiquete: el neto incluye el trailer porque B entro sin el y salio con el.
  const neto = 40500 - 7500;
  verificar('tiquete · neto crudo incluye el trailer', neto, 33000);

  const carga = cargaReal({ neto, pesoTrailer: fila.Peso_Trailer, recogeTrailer: true, noContenedor: 'MSCU1234567' });
  verificar('tiquete · CARGA descuenta el trailer', carga, 22000);
  verificar('tiquete · VGM = tara contenedor + carga',
    vgm({ taraContenedor: 4000, carga, noContenedor: 'MSCU1234567' }), 26000);
}

/* =================================================================== */
console.log('\nESCENARIO 3 · Entra lleno y sale vacio (importacion)');
console.log('  A lo deja lleno, se descarga en planta, B se lo lleva vacio.\n');
{
  let fila = filaNueva({
    trailer: 'R-QA-05',
    placaEntrada: 'ABC-105',
    pesoEntrada: 40000,   // A + trailer + mercancia
    taraContenedor: 4000,
  });

  // Paso 2: A sale solo, pero el trailer entro CARGADO.
  fila = aplicarTaraVehiculo(fila, { taraVehiculo: 7000, conCarga: true });
  verificar('paso 2 · el extremo cargado no aporta determinacion',
    fila.Peso_Trailer_Entrada, null);
  verificar('paso 2 · sin determinaciones el peso queda sin definir',
    fila.Peso_Trailer, null);

  // Paso 5: B se lleva el trailer ya vacio.
  fila = aplicarSalida(fila, {
    placa: 'XYZ-205',
    pesoConjunto: 18500,  // B + trailer vacio
    taraVehiculo: 7500,
    conCarga: false,
  });
  verificar('paso 5 · el extremo vacio si aporta determinacion',
    fila.Peso_Trailer_Salida, 11000);
  verificar('paso 5 · PESO TRAILER sale del unico extremo vacio',
    fila.Peso_Trailer, 11000);

  // El VGM de la importacion pertenece al movimiento de entrada, no a este.
  const netoSalida = 18500 - 7500;
  const cargaSalida = cargaReal({
    neto: netoSalida, pesoTrailer: fila.Peso_Trailer, recogeTrailer: true, noContenedor: '',
  });
  verificar('tiquete de salida · no hay carga, el trailer va vacio', cargaSalida, 0);
}

/* =================================================================== */
console.log('\nESCENARIO 4 · Despacho normal con contenedor, sin ciclo de trailer\n');
{
  // El vehiculo entra vacio (18.000) y sale cargado (40.000).
  const neto = 40000 - 18000;
  const carga = cargaReal({ neto, pesoTrailer: null, recogeTrailer: false });
  verificar('carga es el neto, no hay trailer que descontar', carga, 22000);
  verificar('VGM = 4.000 + 22.000',
    vgm({ taraContenedor: 4000, carga, noContenedor: 'MSCU1234567' }), 26000);
}

/* =================================================================== */
console.log('\nESCENARIO 5 · Casos degenerados\n');
{
  verificar('recoger trailer sin peso de trailer conocido no inventa carga',
    cargaReal({ neto: 33000, pesoTrailer: null, recogeTrailer: true, noContenedor: 'MSCU1' }), null);
  verificar('carga negativa se corrige a cero, nunca sale negativa',
    cargaReal({ neto: 10000, pesoTrailer: 11000, recogeTrailer: true, noContenedor: 'MSCU1' }), 0);
  verificar('VGM sin carga resuelta no se declara',
    vgm({ taraContenedor: 4000, carga: null, noContenedor: 'MSCU1234567' }), null);

  // Los dos extremos cargados: fisicamente no se puede despejar el trailer.
  let fila = filaNueva({ trailer: 'R-X', placaEntrada: 'A', pesoEntrada: 40000, taraContenedor: 4000 });
  fila = aplicarTaraVehiculo(fila, { taraVehiculo: 7000, conCarga: true });
  fila = aplicarSalida(fila, { placa: 'B', pesoConjunto: 40500, taraVehiculo: 7500, conCarga: true });
  verificar('con los dos extremos cargados el peso queda sin determinar',
    fila.Peso_Trailer, null);
}

/* =================================================================== */
console.log(`\n${'-'.repeat(62)}`);
if (fallas.length === 0) {
  console.log(`${pasadas} verificaciones de escenario, todas pasaron.`);
  process.exit(0);
} else {
  console.log(`${pasadas} pasaron, ${fallas.length} fallaron:`);
  fallas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
