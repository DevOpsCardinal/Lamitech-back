/*
 * Pruebas unitarias de calculos/pesos.js.
 *
 * Los grupos marcados REGRESION corresponden a fallas que llegaron a
 * produccion: cada uno tiene su tiquete real detras.
 */

const assert = require('assert');
const {
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
} = require('../src/calculos/pesos');

let corridas = 0;
function comprobar(descripcion, real, esperado) {
  corridas += 1;
  assert.deepStrictEqual(real, esperado, `${descripcion}: se esperaba ${JSON.stringify(esperado)} y llego ${JSON.stringify(real)}`);
}

/* ------------------------------------------------------------------ entero */

comprobar('entero convierte texto', entero('1500'), 1500);
comprobar('entero redondea', entero(1500.6), 1501);
comprobar('entero de null es null', entero(null), null);
comprobar('entero de undefined es null', entero(undefined), null);
comprobar('entero de cadena vacia es null', entero(''), null);
comprobar('entero de texto no numerico es null', entero('abc'), null);
comprobar('entero de NaN es null', entero(NaN), null);
comprobar('entero conserva el cero', entero(0), 0);

/* ------------------------------------------------------- declaracion de contenedor */

comprobar('hay contenedor con numero', hayContenedor('MSCU1234567'), true);
comprobar('no hay contenedor vacio', hayContenedor(''), false);
comprobar('no hay contenedor con espacios', hayContenedor('   '), false);
comprobar('no hay contenedor null', hayContenedor(null), false);

// REGRESION: el tiquete 37106 salio sin VGM porque el operario no digito el
// numero de contenedor, aunque si digito su tara. Escribir la tara -que se lee
// del costado del contenedor- ya es declarar que hay uno.
comprobar(
  'la tara digitada declara contenedor aunque falte el numero',
  hayDeclaracionContenedor({ noContenedor: '', taraContenedor: 20 }),
  true
);
comprobar(
  'sin numero y sin tara no hay contenedor',
  hayDeclaracionContenedor({ noContenedor: '', taraContenedor: 0 }),
  false
);
comprobar(
  'sin numero y sin tara declarada no hay contenedor',
  hayDeclaracionContenedor({ noContenedor: null, taraContenedor: null }),
  false
);
comprobar(
  'el numero solo basta',
  hayDeclaracionContenedor({ noContenedor: 'PRUEBA', taraContenedor: null }),
  true
);

/* -------------------------------------------------------------- determinar */

comprobar('determinacion simple', determinar({ conjunto: 18000, taraVehiculo: 7000 }), 11000);
comprobar('sin conjunto no hay determinacion', determinar({ conjunto: null, taraVehiculo: 7000 }), null);
comprobar('sin tara no hay determinacion', determinar({ conjunto: 18000, taraVehiculo: null }), null);
comprobar('una resta negativa no es un peso', determinar({ conjunto: 5000, taraVehiculo: 7000 }), null);
comprobar('una resta cero no es un peso', determinar({ conjunto: 7000, taraVehiculo: 7000 }), null);

// REGRESION: antes se descartaba la determinacion cuando el movimiento traia
// numero de contenedor. Ahora se guarda siempre en crudo y quien decide si el
// extremo iba cargado es la comparacion entre las dos.
comprobar(
  'la determinacion se guarda aunque el extremo vaya cargado',
  determinar({ conjunto: 33000, taraVehiculo: 7000 }),
  26000
);

/* ------------------------------------------------------------ pesoTrailer */

comprobar('sin determinaciones no hay peso', pesoTrailer({}), null);
comprobar(
  'una sola determinacion se devuelve tal cual',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: null }),
  11000
);
comprobar(
  'dos determinaciones que concuerdan se promedian',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100 }),
  11050
);
comprobar(
  'el promedio se redondea',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11001 }),
  11001
);
comprobar(
  'justo en la tolerancia todavia se promedia',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11000 + TOLERANCIA_KG }),
  11100
);

// REGRESION: tiquete 37106. El trailer salio con 1400 kg de producto y sin
// numero de contenedor, asi que los dos extremos se tomaron como vacios y el
// promedio dio 1550 en vez de los 850 que pesa el trailer.
comprobar(
  'si las determinaciones discrepan, el trailer es la menor',
  pesoTrailer({ Peso_Trailer_Entrada: 850, Peso_Trailer_Salida: 2250 }),
  850
);
comprobar(
  'da igual en que extremo este la carga',
  pesoTrailer({ Peso_Trailer_Entrada: 2250, Peso_Trailer_Salida: 850 }),
  850
);
comprobar(
  'un kilo por encima de la tolerancia ya no promedia',
  pesoTrailer({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11000 + TOLERANCIA_KG + 1 }),
  11000
);

/* --------------------------------------------------------- extremoCargado */

comprobar('sin las dos determinaciones no se sabe', extremoCargado({ Peso_Trailer_Entrada: 850 }), null);
comprobar(
  'si concuerdan ninguno iba cargado',
  extremoCargado({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100 }),
  null
);
comprobar(
  'el extremo cargado es el mayor',
  extremoCargado({ Peso_Trailer_Entrada: 850, Peso_Trailer_Salida: 2250 }),
  'Salida'
);
comprobar(
  'tambien lo detecta en la entrada',
  extremoCargado({ Peso_Trailer_Entrada: 2250, Peso_Trailer_Salida: 850 }),
  'Entrada'
);

/* ------------------------------------------- diferenciaDeterminaciones */

comprobar(
  'diferencia con las dos determinaciones',
  diferenciaDeterminaciones({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: 11100 }),
  100
);
comprobar(
  'diferencia sin una de las dos es null',
  diferenciaDeterminaciones({ Peso_Trailer_Entrada: 11000, Peso_Trailer_Salida: null }),
  null
);

/* ----------------------------------------------- aplicarTaraVehiculo */

comprobar(
  'el primer vehiculo alimenta la entrada',
  aplicarTaraVehiculo({ Peso_Entrada: 18000, taraCab1: null }, { taraVehiculo: 7000 }),
  {
    Peso_Entrada: 18000,
    taraCab1: 7000,
    Peso_Trailer_Entrada: 11000,
    Peso_Trailer: 11000,
    Diferencia_Determinaciones: null,
  }
);

// REGRESION: despachos pasaba la tara arrastrada del transito en vez del pesaje
// actual, y taraCab1 quedaba en 18000 con la determinacion de entrada en null.
comprobar(
  'sin tara la fila no se toca',
  aplicarTaraVehiculo({ Peso_Entrada: 18000, taraCab1: null }, { taraVehiculo: null }),
  { Peso_Entrada: 18000, taraCab1: null }
);

comprobar(
  'el segundo vehiculo alimenta la salida',
  aplicarTaraVehiculo(
    { Peso_Entrada: 18000, Peso_Salida: 18100, taraCab1: 7000, Peso_Trailer_Entrada: 11000 },
    { taraVehiculo: 7050 }
  ),
  {
    Peso_Entrada: 18000,
    Peso_Salida: 18100,
    taraCab1: 7000,
    taraCab2: 7050,
    Peso_Trailer_Entrada: 11000,
    Peso_Trailer_Salida: 11050,
    Peso_Trailer: 11025,
    Diferencia_Determinaciones: 50,
  }
);

/* ------------------------------------------------------- aplicarSalida */

const cerrada = aplicarSalida(
  { Peso_Entrada: 18000, taraCab1: 7000, Peso_Trailer_Entrada: 11000, taraCab2: null },
  { placa: 'XYZ-202', pesoConjunto: 18100, taraVehiculo: 7050 }
);
comprobar('la salida guarda el conjunto', cerrada.Peso_Salida, 18100);
comprobar('la salida resuelve taraCab2', cerrada.taraCab2, 7050);
comprobar('la salida determina el trailer', cerrada.Peso_Trailer_Salida, 11050);
comprobar('la salida promedia', cerrada.Peso_Trailer, 11025);
comprobar('la salida culmina el viaje', cerrada.Culminado, true);

// REGRESION: taraCab2 se resolvia al entrar el vehiculo, cuando todavia no se
// sabe que trailer se llevara. Si el movimiento no la trae se respeta la que ya
// estuviera guardada.
comprobar(
  'sin tara en el movimiento se usa la taraCab2 guardada',
  aplicarSalida(
    { Peso_Entrada: 18000, taraCab1: 7000, Peso_Trailer_Entrada: 11000, taraCab2: 7050 },
    { placa: 'XYZ-202', pesoConjunto: 18100, taraVehiculo: null }
  ).Peso_Trailer_Salida,
  11050
);

/* ------------------------------------------------------------ cargaReal */

comprobar(
  'movimiento normal: la carga es el neto',
  cargaReal({ neto: 22000, incluyeTrailer: false }),
  22000
);
comprobar('sin neto no hay carga', cargaReal({ neto: null, incluyeTrailer: false }), null);

// REGRESION: tiquete 37106. El neto incluia el trailer y el VGM salia inflado
// en el trailer completo.
comprobar(
  'recogiendo trailer se descuenta el trailer',
  cargaReal({ neto: 2250, pesoTrailer: 850, incluyeTrailer: true }),
  1400
);

// REGRESION: restar el promedio del neto dejaba una carga fantasma de decenas
// de kilos cuando el trailer viajaba vacio en los dos extremos.
comprobar(
  'un residuo dentro de la tolerancia es cero',
  cargaReal({ neto: 11100, pesoTrailer: 11050, incluyeTrailer: true }),
  0
);
comprobar(
  'justo en la tolerancia sigue siendo cero',
  cargaReal({ neto: 11050 + TOLERANCIA_KG, pesoTrailer: 11050, incluyeTrailer: true }),
  0
);
comprobar(
  'un kilo mas ya es carga',
  cargaReal({ neto: 11050 + TOLERANCIA_KG + 1, pesoTrailer: 11050, incluyeTrailer: true }),
  TOLERANCIA_KG + 1
);
comprobar(
  'un residuo negativo grande se acota a cero',
  cargaReal({ neto: 5000, pesoTrailer: 11050, incluyeTrailer: true }),
  0
);

// REGRESION: tiquete 37108. Con el trailer desconocido se devolvia una carga
// equivocada; ahora la carga queda indeterminada y el tiquete sale en blanco en
// vez de declarar un VGM inventado.
comprobar(
  'sin peso de trailer conocido la carga es indeterminable',
  cargaReal({ neto: 2270, pesoTrailer: null, incluyeTrailer: true }),
  null
);

/* ------------------------------------------------------------------- vgm */

comprobar('vgm normal', vgm({ taraContenedor: 4000, carga: 22000, noContenedor: 'MSCU1' }), 26000);
comprobar(
  'sin contenedor declarado no hay vgm',
  vgm({ taraContenedor: 0, carga: 22000, noContenedor: '' }),
  null
);
comprobar(
  'con tara declarada hay vgm aunque falte el numero',
  vgm({ taraContenedor: 20, carga: 1400, noContenedor: '' }),
  1420
);
comprobar(
  'sin carga conocida no hay vgm',
  vgm({ taraContenedor: 4000, carga: null, noContenedor: 'MSCU1' }),
  null
);
comprobar(
  'un contenedor vacio declara su propia tara',
  vgm({ taraContenedor: 4000, carga: 0, noContenedor: 'MSCU1' }),
  4000
);

/* ------------------------------------------------------------ conCalculos */

comprobar('conCalculos respeta null', conCalculos(null), null);
comprobar(
  'conCalculos recalcula desde las determinaciones',
  conCalculos({ Peso_Trailer: 99999, Peso_Trailer_Entrada: 850, Peso_Trailer_Salida: 2250 }),
  {
    Peso_Trailer: 850,
    Peso_Trailer_Entrada: 850,
    Peso_Trailer_Salida: 2250,
    Diferencia_Determinaciones: 1400,
    Extremo_Cargado: 'Salida',
  }
);
comprobar(
  'conCalculos respeta filas viejas sin determinaciones',
  conCalculos({ Peso_Trailer: 12000 }),
  {
    Peso_Trailer: 12000,
    Diferencia_Determinaciones: null,
    Extremo_Cargado: null,
  }
);

console.log(`pesos.test.js: ${corridas} pruebas, todas pasaron`);
