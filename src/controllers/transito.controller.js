const { getConnection, sql } = require('../database/connection');
const { entero } = require('../calculos/pesos');

async function transito(req, res) {
  console.log('req.transito: ', req.body);

  try {
    const pool = await getConnection();
    const {
      placa,
      conductor,
      cedulaCiudadania,
      productoMateria,
      planta,
      clienteProveedor,
      destino,
      transportadora,
      n_shipment,
      n_sello,
      n_R,
      n_contenedor,
      observaciones,
      tara_contenedor,
      responsable,
    } = req.body.formValue;

    const {
      caso,
      bruto,
      tara,
      neto,
      operario,
      nickOperario,
      procesoDescargar,
      procesoRecoger,
    } = req.body;

    const query = `
           INSERT INTO Vehiculos_en_Transito
           (Placa, Caso, Conductor, Cedula, MateriaPrima_Producto, Planta, Cliente_Proveedor, 
            Origen_Destino, Transportadora, Fecha_Peso_Vacio, Hora_Peso_Vacio, 
            Fecha_Peso_Lleno, Hora_Peso_Lleno, Bruto, Tara, Neto, No_Tiquete, Operario, Nick_Operario, 
            No_Shipment, No_Sello, No_R, No_Contenedor, Observaciones, tara_contenedor, responsable, Fecha_Entrada)
           VALUES 
           (@Placa, @Caso, @Conductor, @Cedula, @MateriaPrima_Producto, @Planta, @Cliente_Proveedor, 
            @Origen_Destino, @Transportadora, 
            CASE WHEN @Caso = 'Ingreso' THEN NULL ELSE FORMAT(GETDATE(), 'yyyy-MM-dd') END, 
            CASE WHEN @Caso = 'Ingreso' THEN NULL ELSE FORMAT(GETDATE(), 'HH:mm') END, 
            CASE WHEN @Caso = 'Despacho' THEN NULL ELSE FORMAT(GETDATE(), 'yyyy-MM-dd')  END, 
            CASE WHEN @Caso = 'Despacho' THEN NULL  ELSE FORMAT(GETDATE(), 'HH:mm') END, 
            @Bruto, @Tara, @Neto, 0, @Operario, @Nick_Operario, 
            @No_Shipment, @No_Sello, @No_R, @No_Contenedor, @Observaciones, @tara_contenedor, @responsable, @Fecha_Entrada)`;

    const response = await pool
      .request()
      .input('Placa', sql.VarChar, placa)
      .input('Conductor', sql.VarChar, conductor)
      .input('Caso', sql.VarChar, caso)
      .input('Cedula', sql.Int, cedulaCiudadania)
      .input('MateriaPrima_Producto', sql.VarChar, productoMateria)
      .input('Planta', sql.VarChar, planta)
      .input('Cliente_Proveedor', sql.VarChar, clienteProveedor)
      .input('Origen_Destino', sql.VarChar, destino)
      .input('Transportadora', sql.VarChar, transportadora)
      .input('Bruto', sql.Int, bruto)
      .input('Tara', sql.Int, tara)
      .input('Neto', sql.Int, neto)
      .input('Operario', sql.VarChar, operario)
      .input('Nick_Operario', sql.VarChar, nickOperario)
      .input('No_Shipment', sql.VarChar, n_shipment)
      .input('No_Sello', sql.VarChar, n_sello)
      .input('No_R', sql.VarChar, n_R)
      .input('No_Contenedor', sql.VarChar, n_contenedor)
      .input('Observaciones', sql.VarChar, observaciones)
      .input('tara_contenedor', sql.Int, parseInt(tara_contenedor))
      .input('responsable', sql.VarChar, responsable)
      .input(
        'Fecha_Entrada',
        sql.VarChar,
        procesoRecoger == true
          ? 'Recoger_Trailer'
          : procesoDescargar == true
          ? 'Descargar_Trailer'
          : ''
      )
      .query(query);

    if (procesoDescargar == true) {
      const checkTrailerQuery = `
                       SELECT TOP 1 Culminado
                       FROM Trailers
                       WHERE Trailer = @Trailer
                       ORDER BY Fecha_Entrada DESC, Hora_Entrada DESC`;

      const checkTrailer = await pool
        .request()
        .input('Trailer', sql.VarChar, n_R)
        .query(checkTrailerQuery);
      console.log('checkTrailer: ', checkTrailer);

      if (checkTrailer.recordset.length > 0) {
        const { Culminado } = checkTrailer.recordset[0];

        if (Culminado == false) {
          // Si el proceso no ha culminado, no se hace nada
          console.log('El proceso aún no ha culminado para este tráiler');
        } else {
          const insertTrailerQuery = `
                          INSERT INTO Trailers (Trailer
              ,Fecha_Entrada
              ,Hora_Entrada
              ,Fecha_Salida
              ,Hora_Salida
              ,Placa_Entrada
              ,Peso_Entrada
              ,Gross_Entrada
              ,Placa_Salida
              ,Peso_Salida
              ,Peso_Trailer
              ,Culminado) 
                          VALUES (@Trailer, FORMAT(GETDATE(), 'yyyy-MM-dd'), FORMAT(GETDATE(), 'HH:mm'), '', '', @Placa_Entrada, @Peso_Entrada, @Gross_Entrada, '', 0, @Peso_Trailer, @Culminado)`;

        const crearTrailer = await pool
          .request()
          .input('Trailer', sql.VarChar, n_R)
          .input('Placa_Entrada', sql.VarChar, placa) // Añade más campos según tu necesidad
          .input(
            'Peso_Entrada',
            sql.Int,
            caso == 'Despacho'
              ? tara == 'NaN' || tara == null || tara == 'null'
                ? 0
                : tara
              : caso == 'Ingreso'
              ? bruto == 'NaN' || bruto == null || bruto == 'null'
                ? 0
                : bruto
              : 0
          )
          .input(
            'Gross_Entrada',
            sql.Int,
            tara_contenedor == 'NaN' || tara_contenedor == null || tara_contenedor == 'null'
              ? 0
              : parseInt(tara_contenedor)
          ) // Añade más campos según tu necesidad
          // El peso del trailer ya no se siembra con la tara del contenedor: son
          // dos magnitudes distintas y mezclarlas hacia que el front descontara la
          // tara dos veces. Queda en null hasta que exista una determinacion real
          // (Peso_Entrada - taraCab1), que se calcula al pesar el cabezote solo.
          .input('Peso_Trailer', sql.Int, null)
          .input('Culminado', sql.Bit, 0) // Añade más campos según tu necesidad
          // Añade más campos según tu necesidad
          .query(insertTrailerQuery);
        console.log('crearTrailer: ', crearTrailer);
        }
      } else {
        const insertTrailerQuery = `
                          INSERT INTO Trailers (Trailer
              ,Fecha_Entrada
              ,Hora_Entrada
              ,Fecha_Salida
              ,Hora_Salida
              ,Placa_Entrada
              ,Peso_Entrada
              ,Gross_Entrada
              ,Placa_Salida
              ,Peso_Salida
              ,Peso_Trailer
              ,Culminado) 
                          VALUES (@Trailer, FORMAT(GETDATE(), 'yyyy-MM-dd'), FORMAT(GETDATE(), 'HH:mm'), '', '', @Placa_Entrada, @Peso_Entrada, @Gross_Entrada, '', 0, @Peso_Trailer, @Culminado)`;

        const crearTrailer = await pool
          .request()
          .input('Trailer', sql.VarChar, n_R)
          .input('Placa_Entrada', sql.VarChar, placa) // Añade más campos según tu necesidad
          .input(
            'Peso_Entrada',
            sql.Int,
            caso == 'Despacho'
              ? tara == 'NaN' || tara == null || tara == 'null'
                ? 0
                : tara
              : caso == 'Ingreso'
              ? bruto == 'NaN' || bruto == null || bruto == 'null'
                ? 0
                : bruto
              : 0
          )
          .input(
            'Gross_Entrada',
            sql.Int,
            tara_contenedor == 'NaN' || tara_contenedor == null || tara_contenedor == 'null'
            ? 0
            : parseInt(tara_contenedor)
          ) // Añade más campos según tu necesidad
          // El peso del trailer ya no se siembra con la tara del contenedor: son
          // dos magnitudes distintas y mezclarlas hacia que el front descontara la
          // tara dos veces. Queda en null hasta que exista una determinacion real
          // (Peso_Entrada - taraCab1), que se calcula al pesar el cabezote solo.
          .input('Peso_Trailer', sql.Int, null)
          .input('Culminado', sql.Bit, 0) // Añade más campos según tu necesidad
          // Añade más campos según tu necesidad
          .query(insertTrailerQuery);
        console.log('crearTrailer: ', crearTrailer);
      }
    }

    console.log('transito', response);
    res.status(200).send({ response });
  } catch (error) {
    console.error('Error en la inserción de transito:', error);
    res.status(500).send('Error en la inserción de transito');
  }
}

async function getAllTransito(req, res) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .query('SELECT * FROM Vehiculos_en_Transito');
  const response = result.recordset;
  res.json(response);
}

async function deleteTransitoById(req, res) {
  console.log('deleteTransitoByIddeleteTransitoByIddeleteTransitoByIddeleteTransitoByIddeleteTransitoById', req.body);
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('Placa', req.body.id)
    .input('No_Shipment', req.body.iden)
    .query('DELETE FROM vehiculos_en_transito WHERE Placa = @Placa AND No_Shipment = @No_Shipment');
  const response = result.recordset;
  console.log('Borrand placa', response);
  res.status(200).send({ response });
}

async function ultimoTrasnsito(req, res) {
  const { caso } = req.body;
  console.log('caso: ', caso);

  if (caso == 'Despacho') {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT TOP (1) * 
       FROM  vehiculos_en_transito
       order by Fecha_peso_vacio desc`);
    const response = result.recordset;
    console.log('response: ', response);

    res.status(200).send({ response });
  }

  if (caso == 'Ingreso') {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT TOP (1) * 
       FROM  vehiculos_en_transito
       order by Fecha_peso_lleno desc`);
    const response = result.recordset;
    console.log('response: ', response);

    res.status(200).send({ response });
  }
}

async function ultimoTransitoByPlaca(req, res) {
  const { placa } = req.body;
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('Placa', sql.VarChar, placa)
    .query('SELECT * FROM Vehiculos_en_Transito where Placa = @Placa');
  const response = result.recordset;
  res.json(response);
}

module.exports = {
  transito,
  getAllTransito,
  deleteTransitoById,
  ultimoTrasnsito,
  ultimoTransitoByPlaca,
};
