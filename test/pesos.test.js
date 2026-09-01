/*
 * Pruebas del punto unico de calculo. Sin dependencias: node test/pesos.test.js
 * Cada caso que empieza con REGRESION reproduce un bug real que estaba en
 * produccion; si alguno vuelve a fallar, el bug volvio.
 */

const {
  determinacionEntrada,
  determinacionSalida,
  pesoTrailer,
  diferenciaDeterminaciones,
  vgm,
  conCalculos,
} = require('../src/calculos/pesos');

let pasadas = 0;
const fallas = [];

function verificar(descripcion, obtenido, esperado) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (ok) {
    pasadas++;
    console.log(`  ok   ${descripcion}`);
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

/* --------------------------------------------------------------- */
grupo('Peso del trailer: promedio de las dos determinaciones');

const viajeCompleto = {
  Peso_Entrada: 18000, taraCab1: 7000,   // determinacion entrada: 11000
  Peso_Salida: 18600,  taraCab2: 7500,   // determinacion salida:  11100
};

verificar('determinacion con el cabezote que lo trajo',
  determinacionEntrada(viajeCompleto), 11000);
verificar('determinacion con el cabezote que se lo lleva',
  determinacionSalida(viajeCompleto), 11100);
verificar('peso = promedio de las dos',
  pesoTrailer(viajeCompleto), 11050);
verificar('diferencia entre determinaciones',
  diferenciaDeterminaciones(viajeCompleto), 100);

verificar('promedio impar se redondea a entero',
  pesoTrailer({ Peso_Entrada: 18000, taraCab1: 7000, Peso_Salida: 18601, taraCab2: 7500 }), 11051);

/* --------------------------------------------------------------- */
grupo('Con una sola determinacion disponible');

verificar('solo entrada: usa esa, no promedia contra cero',
  pesoTrailer({ Peso_Entrada: 18000, taraCab1: 7000 }), 11000);
verificar('solo salida: usa esa',
  pesoTrailer({ Peso_Salida: 18600, taraCab2: 7500 }), 11100);
verificar('con una sola no hay diferencia que reportar',
  diferenciaDeterminaciones({ Peso_Entrada: 18000, taraCab1: 7000 }), null);

/* --------------------------------------------------------------- */
grupo('Sin datos suficientes: null, nunca 0 ni NaN');

verificar('fila recien creada, sin taras',
  pesoTrailer({ Peso_Entrada: 18000 }), null);
verificar('fila vacia',
  pesoTrailer({}), null);

/* --------------------------------------------------------------- */
grupo('REGRESION: la formula ya no es recursiva');

// Antes: Peso_Trailer = Peso_Entrada - (tara + Peso_Trailer), asi que el
// resultado cambiaba en cada pasada segun el valor anterior.
const conBasura = { ...viajeCompleto, Peso_Trailer: 999999 };
verificar('un Peso_Trailer previo absurdo no altera el resultado',
  pesoTrailer(conBasura), 11050);
verificar('un Peso_Trailer previo en cero tampoco',
  pesoTrailer({ ...viajeCompleto, Peso_Trailer: 0 }), 11050);

/* --------------------------------------------------------------- */
grupo('REGRESION: parseInt(null) producia NaN en la base');

verificar('taraCab1 nula no genera NaN',
  determinacionEntrada({ Peso_Entrada: 18000, taraCab1: null }), null);
verificar('taraCab1 indefinida no genera NaN',
  determinacionEntrada({ Peso_Entrada: 18000 }), null);
verificar('cadena vacia no genera NaN',
  determinacionEntrada({ Peso_Entrada: 18000, taraCab1: '' }), null);
verificar('texto no numerico no genera NaN',
  determinacionEntrada({ Peso_Entrada: 18000, taraCab1: 'abc' }), null);

/* --------------------------------------------------------------- */
grupo('REGRESION: taraCab2 pisada con el peso del conjunto');

// Al cerrar el viaje se escribia taraCab2 = Peso_Salida, y la determinacion
// de salida quedaba en cero.
verificar('conjunto igual a la tara del cabezote se descarta',
  determinacionSalida({ Peso_Salida: 18600, taraCab2: 18600 }), null);
verificar('tara mayor que el conjunto se descarta',
  determinacionSalida({ Peso_Salida: 7000, taraCab2: 18600 }), null);
verificar('una determinacion invalida no arrastra el promedio',
  pesoTrailer({ Peso_Entrada: 18000, taraCab1: 7000, Peso_Salida: 18600, taraCab2: 18600 }), 11000);

/* --------------------------------------------------------------- */
grupo('REGRESION: el trailer que se lleva no se sabe hasta la salida');

// Cuando un vehiculo entra a buscar trailer no se sabe cual se llevara, asi
// que taraCab2 no puede registrarse en ese pesaje: se resuelve al salir, con
// los dos pesajes que trae el propio movimiento.
verificar('sin taraCab2 solo hay determinacion de entrada',
  pesoTrailer({ Peso_Entrada: 18000, taraCab1: 7000, Peso_Salida: 18600 }), 11000);
verificar('con taraCab2 resuelta en la salida ya promedia',
  pesoTrailer({ Peso_Entrada: 18000, taraCab1: 7000, Peso_Salida: 18600, taraCab2: 7500 }), 11050);
verificar('la determinacion de salida equivale al neto del movimiento',
  determinacionSalida({ Peso_Salida: 18600, taraCab2: 7500 }), 18600 - 7500);

/* --------------------------------------------------------------- */
grupo('Tolerancia de tipos: SQL Server puede devolver texto');

verificar('pesos como string se interpretan igual',
  pesoTrailer({ Peso_Entrada: '18000', taraCab1: '7000', Peso_Salida: '18600', taraCab2: '7500' }), 11050);

/* --------------------------------------------------------------- */
grupo('VGM (SOLAS cap. VI regla 2) = tara del contenedor + carga');

const CONT = 'MSCU1234567';

verificar('caso normal', vgm({ taraContenedor: 4000, neto: 22000, noContenedor: CONT }), 26000);
verificar('no incluye cabezote ni trailer: solo suma los dos valores',
  vgm({ taraContenedor: 3800, neto: 0, noContenedor: CONT }), 3800);
verificar('sin tara de contenedor no se declara VGM',
  vgm({ taraContenedor: null, neto: 22000, noContenedor: CONT }), null);
verificar('sin neto no se declara VGM',
  vgm({ taraContenedor: 4000, neto: null, noContenedor: CONT }), null);
verificar('tara como string',
  vgm({ taraContenedor: '4000', neto: '22000', noContenedor: CONT }), 26000);

// REGRESION: un movimiento de trailer vacio emitia un VGM igual al peso del
// trailer, porque la tara del contenedor llegaba en cero y se sumaba al neto.
verificar('REGRESION movimiento sin contenedor no declara VGM',
  vgm({ taraContenedor: 0, neto: 11100, noContenedor: '' }), null);
verificar('REGRESION contenedor nulo no declara VGM',
  vgm({ taraContenedor: 0, neto: 11100, noContenedor: null }), null);
verificar('REGRESION contenedor en blancos no declara VGM',
  vgm({ taraContenedor: 4000, neto: 22000, noContenedor: '   ' }), null);

/* --------------------------------------------------------------- */
grupo('conCalculos: filas historicas anteriores a la migracion');

const historicaRecuperable = {
  Trailer: 'R-100', Peso_Entrada: 18000, taraCab1: 7000,
  Peso_Salida: 18600, taraCab2: 7500,
  Peso_Trailer: 3500,   // valor corrupto de la formula vieja
};
verificar('recalcula el peso corrupto a partir de los pesos originales',
  conCalculos(historicaRecuperable).Peso_Trailer, 11050);
verificar('expone la determinacion de entrada',
  conCalculos(historicaRecuperable).Peso_Trailer_Entrada, 11000);
verificar('expone la diferencia',
  conCalculos(historicaRecuperable).Diferencia_Determinaciones, 100);

const historicaSinPesos = { Trailer: 'R-200', Peso_Trailer: 4200 };
verificar('si no se puede recalcular, respeta el valor guardado',
  conCalculos(historicaSinPesos).Peso_Trailer, 4200);

verificar('null se propaga sin romper', conCalculos(null), null);

/* --------------------------------------------------------------- */
console.log(`\n${'-'.repeat(60)}`);
if (fallas.length === 0) {
  console.log(`${pasadas} pruebas, todas pasaron.`);
  process.exit(0);
} else {
  console.log(`${pasadas} pasaron, ${fallas.length} fallaron:`);
  fallas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
