/*
 * Pruebas del punto unico de calculo. Sin dependencias: node test/pesos.test.js
 * Los casos que empiezan con REGRESION reproducen un bug real que estuvo en
 * produccion; si alguno vuelve a fallar, el bug volvio.
 */

const {
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

function grupo(titulo) {
  console.log(`\n${titulo}`);
}

const CONT = 'MSCU1234567';

/* --------------------------------------------------------------- */
grupo('entero(): nunca deja pasar NaN a la base');

verificar('numero', entero(7000), 7000);
verificar('texto numerico', entero('7000'), 7000);
verificar('decimal se redondea', entero(7000.4), 7000);
verificar('REGRESION null no produce NaN', entero(null), null);
verificar('REGRESION undefined no produce NaN', entero(undefined), null);
verificar('REGRESION cadena vacia no produce NaN', entero(''), null);
verificar('REGRESION texto no numerico no produce NaN', entero('abc'), null);

/* --------------------------------------------------------------- */
grupo('hayContenedor()');

verificar('con numero de contenedor', hayContenedor(CONT), true);
verificar('vacio', hayContenedor(''), false);
verificar('nulo', hayContenedor(null), false);
verificar('solo espacios', hayContenedor('   '), false);

/* --------------------------------------------------------------- */
grupo('determinar(): despeja el trailer de un pesaje');

verificar('conjunto menos vehiculo',
  determinar({ conjunto: 18000, taraVehiculo: 7000 }), 11000);
verificar('acepta texto',
  determinar({ conjunto: '18000', taraVehiculo: '7000' }), 11000);
verificar('sin tara del vehiculo no hay determinacion',
  determinar({ conjunto: 18000, taraVehiculo: null }), null);
verificar('REGRESION conjunto igual a la tara se descarta',
  determinar({ conjunto: 18600, taraVehiculo: 18600 }), null);
verificar('REGRESION resultado negativo se descarta',
  determinar({ conjunto: 7000, taraVehiculo: 18600 }), null);
verificar('un extremo cargado no aporta determinacion',
  determinar({ conjunto: 40500, taraVehiculo: 7500, conCarga: true }), null);

/* --------------------------------------------------------------- */
grupo('pesoTrailer(): promedio de las determinaciones guardadas');

verificar('promedio de las dos',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100 }), 11050);
verificar('promedio impar se redondea',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11101 }), 11051);
verificar('con una sola usa esa, no promedia contra cero',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: null }), 11000);
verificar('solo la de salida',
  pesoTrailer({ Peso_Trailer_Entrada: null, Peso_Trailer_Salida: 11100 }), 11100);
verificar('sin ninguna devuelve null, nunca cero',
  pesoTrailer({ Peso_Trailer_Entrada: null, Peso_Trailer_Salida: null }), null);

verificar('diferencia entre determinaciones',
  diferenciaDeterminaciones({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100 }), 100);
verificar('con una sola no hay diferencia que reportar',
  diferenciaDeterminaciones({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: null }), null);

/* --------------------------------------------------------------- */
grupo('REGRESION: la formula ya no es recursiva');

// Antes: Peso_Trailer = Peso_Entrada - (tara + Peso_Trailer), de modo que el
// resultado cambiaba en cada pasada segun el valor anterior.
const conBasura = {
  Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100, Peso_Trailer: 999999,
};
verificar('un Peso_Trailer previo absurdo no altera el resultado',
  pesoTrailer(conBasura), 11050);

/* --------------------------------------------------------------- */
grupo('aplicarTaraVehiculo(): el vehiculo se peso solo');

const filaBase = {
  Peso_Entrada: 18000, Peso_Salida: 0,
  taraCab1: null, taraCab2: null,
  Peso_Trailer_Entrada: null, Peso_Trailer_Salida: null,
};

const trasPrimerVehiculo = aplicarTaraVehiculo(filaBase, { taraVehiculo: 7000 });
verificar('el primero llena taraCab1', trasPrimerVehiculo.taraCab1, 7000);
verificar('y la determinacion de entrada', trasPrimerVehiculo.Peso_Trailer_Entrada, 11000);
verificar('el peso queda en esa determinacion', trasPrimerVehiculo.Peso_Trailer, 11000);

const trasSegundoVehiculo = aplicarTaraVehiculo(trasPrimerVehiculo, { taraVehiculo: 7500 });
verificar('REGRESION el segundo no pisa taraCab1', trasSegundoVehiculo.taraCab1, 7000);
verificar('el segundo llena taraCab2', trasSegundoVehiculo.taraCab2, 7500);

verificar('si el trailer venia cargado no se registra determinacion',
  aplicarTaraVehiculo({ ...filaBase, Peso_Entrada: 40000 },
    { taraVehiculo: 7000, conCarga: true }).Peso_Trailer_Entrada, null);

/* --------------------------------------------------------------- */
grupo('aplicarSalida(): el vehiculo se lleva el trailer');

const cerrada = aplicarSalida(trasPrimerVehiculo, {
  placa: 'XYZ-201', pesoConjunto: 18600, taraVehiculo: 7500,
});
verificar('registra el peso de salida', cerrada.Peso_Salida, 18600);
verificar('REGRESION taraCab2 no se pisa con el peso del conjunto', cerrada.taraCab2, 7500);
verificar('determinacion de salida', cerrada.Peso_Trailer_Salida, 11100);
verificar('PESO TRAILER es el promedio', cerrada.Peso_Trailer, 11050);
verificar('cierra el viaje', cerrada.Culminado, true);

// REGRESION: al entrar un vehiculo no se sabe que trailer se llevara, asi que
// taraCab2 se resuelve al salir, con los dos pesajes del propio movimiento.
verificar('sin taraCab2 previa la resuelve la salida',
  aplicarSalida(trasPrimerVehiculo,
    { placa: 'X', pesoConjunto: 18600, taraVehiculo: 7500 }).taraCab2, 7500);
verificar('si la salida no trae tara, conserva la que hubiera',
  aplicarSalida(trasSegundoVehiculo,
    { placa: 'X', pesoConjunto: 18600, taraVehiculo: null }).taraCab2, 7500);

/* --------------------------------------------------------------- */
grupo('cargaReal(): descuenta el trailer cuando corresponde');

verificar('movimiento normal: la carga es el neto',
  cargaReal({ neto: 22000, recogeTrailer: false }), 22000);
verificar('REGRESION recogiendo trailer se descuenta su peso',
  cargaReal({ neto: 33000, pesoTrailer: 11000, recogeTrailer: true, noContenedor: CONT }), 22000);
verificar('REGRESION trailer vacio no genera carga fantasma',
  cargaReal({ neto: 11100, pesoTrailer: 11050, recogeTrailer: true, noContenedor: '' }), 0);
verificar('sin peso de trailer conocido no se inventa carga',
  cargaReal({ neto: 33000, pesoTrailer: null, recogeTrailer: true, noContenedor: CONT }), null);
verificar('nunca devuelve carga negativa',
  cargaReal({ neto: 10000, pesoTrailer: 11000, recogeTrailer: true, noContenedor: CONT }), 0);

/* --------------------------------------------------------------- */
grupo('vgm(): SOLAS cap. VI regla 2 = tara del contenedor + carga');

verificar('caso normal', vgm({ taraContenedor: 4000, carga: 22000, noContenedor: CONT }), 26000);
verificar('no incluye vehiculo ni trailer, solo suma los dos valores',
  vgm({ taraContenedor: 3800, carga: 0, noContenedor: CONT }), 3800);
verificar('sin tara de contenedor no se declara',
  vgm({ taraContenedor: null, carga: 22000, noContenedor: CONT }), null);
verificar('sin carga resuelta no se declara',
  vgm({ taraContenedor: 4000, carga: null, noContenedor: CONT }), null);
verificar('acepta texto', vgm({ taraContenedor: '4000', carga: '22000', noContenedor: CONT }), 26000);

// REGRESION: un movimiento de trailer vacio emitia un VGM igual al peso del
// trailer, porque la tara del contenedor llegaba en cero y se sumaba al neto.
verificar('REGRESION sin contenedor no se declara VGM',
  vgm({ taraContenedor: 0, carga: 11100, noContenedor: '' }), null);
verificar('REGRESION contenedor nulo no se declara VGM',
  vgm({ taraContenedor: 0, carga: 11100, noContenedor: null }), null);
verificar('REGRESION contenedor en blancos no se declara VGM',
  vgm({ taraContenedor: 4000, carga: 22000, noContenedor: '   ' }), null);

/* --------------------------------------------------------------- */
grupo('conCalculos(): filas historicas anteriores a la migracion');

verificar('recalcula el peso corrupto desde las determinaciones',
  conCalculos({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100, Peso_Trailer: 3500 })
    .Peso_Trailer, 11050);
verificar('expone la diferencia',
  conCalculos({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100 })
    .Diferencia_Determinaciones, 100);
verificar('si no se puede recalcular, respeta el valor guardado',
  conCalculos({ Trailer: 'R-200', Peso_Trailer: 4200 }).Peso_Trailer, 4200);
verificar('null se propaga sin romper', conCalculos(null), null);

/* --------------------------------------------------------------- */
console.log(`\n${'-'.repeat(62)}`);
if (fallas.length === 0) {
  console.log(`${pasadas} pruebas, todas pasaron.`);
  process.exit(0);
} else {
  console.log(`${pasadas} pasaron, ${fallas.length} fallaron:`);
  fallas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
