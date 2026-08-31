
const {getConnection, sql} = require('../database/connection')
const {sendMail} = require('../mail/transito')
const {CrearPdf} = require('../mail/crearArchivoPdf')
const {createSftp} = require('../mail/sftp')

async function tiquete(){
   const pool = await getConnection();
   const result = await pool.request().query("select Valor from Configuraciones where Parametro = 'No_Tiquete_Despachos'")
   const response = result.recordset
   return response
}

async function updateConteo(noTiquete){
   const pool = await getConnection();
   const result = await pool.request()
      .input("Valor", sql.VarChar, `${noTiquete}`)
      .query("update Configuraciones set Valor  = @Valor where Parametro = 'No_Tiquete_Despachos'")
   const response = result.recordset
   return response
}

async function ultimoDespacho(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT TOP (1) * FROM Despachos order by No_Tiquete desc')
   const response = result.recordset
   console.log("countDespachos",response)
   res.json(response)
}

async function countDespachosInterno(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT TOP (1) No_Tiquete FROM Despachos order by No_Tiquete desc')
   const response = result.recordset
   console.log(response)
   return response
}

async function getDespachos(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT TOP (100) * FROM Despachos order by No_Tiquete desc')
   const response = result.recordset
   res.json(response)
}

async function getDespachosByDate(req, res){
   const proceso = req.body.proceso
   if (req.body.busqueda == null || req.body.busqueda == "") {
      const fechaInicial = req.body.fechaInicial
      const fechaFinal = req.body.fechaFinal
      const valor = req.body.valor
      const query = `select * from Despachos where Fecha_Peso_Vacio  between @fechaInicial and @fechaFinal order by No_Tiquete desc `
      const pool = await getConnection();
      const result = await pool.request()
         .input("fechaInicial", sql.VarChar, fechaInicial)
         .input("fechaFinal", sql.VarChar, fechaFinal)
         .input("Valor", sql.VarChar, valor)
         .query(query)
         const response = result.recordset
         console.log(response)
         res.json(response)
   } else if (req.body.proceso == 'Todos') {
      const fechaInicial = req.body.fechaInicial
      const fechaFinal = req.body.fechaFinal
      const busqueda = req.body.busqueda
      const valor = req.body.valor
      const query = `select * from Despachos where ${busqueda} = @Valor and Fecha_Peso_Vacio  between @fechaInicial and @fechaFinal order by No_Tiquete desc `
      const pool = await getConnection();
      const result = await pool.request()
         .input("fechaInicial", sql.VarChar, fechaInicial)
         .input("fechaFinal", sql.VarChar, fechaFinal)
         .input("Valor", sql.VarChar, valor)
         .query(query)
         const response = result.recordset
         console.log(response)
         res.json(response)
   } else {
      const fechaInicial = req.body.fechaInicial
      const fechaFinal = req.body.fechaFinal
      const busqueda = req.body.busqueda
      const valor = req.body.valor
      const pool = await getConnection();
      const result = await pool.request()
         .input("fechaInicial", sql.VarChar, fechaInicial)
         .input("fechaFinal", sql.VarChar, fechaFinal)
         .input("Valor", sql.VarChar, valor)
         .query(`select * from Despachos where  ${busqueda} = @Valor and Fecha_Peso_Vacio between @fechaInicial and @fechaFinal order by No_Tiquete desc`)
      const response = result.recordset
      console.log(response)
      res.json(response)
   }
}



async function createDespacho(req, res){

   const responseTiquete = await tiquete()
   const number = parseInt(responseTiquete?.[0].Valor)
   console.log("tiquete", number);
   console.log("req.body: ", req.body);
   
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
          responsable
      } = req.body.formValue;

      const { bruto, tara, neto, operario, nickOperario, fechaIngreso, horaIngreso, procesoRecoger, procesoDescargar } = req.body;

      const query = `
          INSERT INTO Despachos
          (Placa, Conductor, Cedula, Producto, Planta, Cliente, 
           Destino, Transportadora, Fecha_Peso_Vacio, Hora_Peso_Vacio, 
           Fecha_Peso_Lleno, Hora_Peso_Lleno, Bruto, Tara, Neto, No_Tiquete, Operario, Nick_Operario, 
           No_Shipment, No_Sello, No_R, No_Contenedor, Observaciones, Tara_Contenedor, Responsable, Neto_Contenedor, Fecha_Entrada)
          VALUES 
          (@Placa, @Conductor, @Cedula, @Producto, @Planta, @Cliente, 
           @Destino, @Transportadora, @Fecha_Peso_Vacio, @Hora_Peso_Vacio, 
           FORMAT(GETDATE(), 'yyyy-MM-dd'), FORMAT(GETDATE(), 'HH:mm'),
           @Bruto, @Tara, @Neto, @No_Tiquete, @Operario, @Nick_Operario, 
           @No_Shipment, @No_Sello, @No_R, @No_Contenedor, @Observaciones, @Tara_Contenedor, @Responsable, @Neto_Contenedor, @Fecha_Entrada)`;

      const response = await pool.request()
          .input("Placa", sql.VarChar, placa)
          .input("Conductor", sql.VarChar, conductor)
          .input("Cedula", sql.Int, cedulaCiudadania)
          .input("Producto", sql.VarChar, productoMateria)
          .input("Planta", sql.VarChar, planta)
          .input("Cliente", sql.VarChar, clienteProveedor)
          .input("Destino", sql.VarChar, destino)
          .input("Transportadora", sql.VarChar, transportadora)
          .input("Fecha_Peso_Vacio", sql.VarChar, fechaIngreso)
          .input("Hora_Peso_Vacio", sql.VarChar, horaIngreso)
          .input("Bruto", sql.Int, bruto == 'NaN' || bruto == null || bruto == 'null'  ? 0: bruto)
          .input("Tara", sql.Int, tara == 'NaN' || tara == null || tara == 'null' ? 0: tara)
          .input("Neto", sql.Int, neto == 'NaN' || neto == null  || neto == 'null' ? 0: neto)
          .input("No_Tiquete", sql.Int, parseInt(number))
          .input("Operario", sql.VarChar, operario)
          .input("Nick_Operario", sql.VarChar, nickOperario)
          .input('No_Shipment', sql.VarChar, n_shipment)
          .input('No_Sello', sql.VarChar, n_sello)
          .input('No_R', sql.VarChar, n_R)
          .input('No_Contenedor', sql.VarChar, n_contenedor)
          .input("Observaciones", sql.VarChar, observaciones)
          .input("Tara_Contenedor", sql.Int, parseInt(tara_contenedor))
          .input("Responsable", sql.VarChar, responsable)
          .input("Neto_Contenedor", sql.Int, neto == 'NaN' || neto == null  || neto == 'null' ? 0: neto)
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

          if (procesoRecoger == true) {
            const checkTrailerQuery = `
                       SELECT TOP 1 culminado
                       FROM Trailers
                       WHERE Trailer = @Trailer
                       ORDER BY Fecha_Entrada DESC`; // Asumo que tienes una columna de fecha para ordenar
        
            const checkTrailer = await pool
              .request()
              .input('Trailer', sql.VarChar, n_R)
              .query(checkTrailerQuery);
            console.log('checkTrailer: ', checkTrailer);
        
            if (checkTrailer.recordset.length > 0) {
              const { culminado } = checkTrailer.recordset[0];
        
              console.log('mayor a cero');
        
              if (culminado == false) {
                // Si el proceso no ha culminado, no se hace nada
                console.log('El proceso aún no ha culminado para este tráiler');
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
                  tara == 'NaN' || tara == null || tara == 'null' ? 0 : tara
                )
                .input(
                  'Gross_Entrada',
                  sql.Int,
                  neto == 'NaN' || neto == null || neto == 'null'
                    ? 0
                    : parseInt(neto) + parseInt(tara_contenedor)
                ) // Añade más campos según tu necesidad
                .input('Peso_Trailer', sql.Int, parseInt(tara_contenedor)) // Añade más campos según tu necesidad
                .input('Culminado', sql.Bit, 0) // Añade más campos según tu necesidad
                // Añade más campos según tu necesidad
                .query(insertTrailerQuery);
              console.log('crearTrailer: ', crearTrailer);
            }
          }

      if(response.rowsAffected){
         console.log("response", response);
         await updateConteo(parseInt(number) + 1)
         res.status(200).send({ response });
      }else {
         res.status(500).send("Error en la inserción de transito");
      }
  } catch (error) {
      console.error("Error en la inserción de transito:", error);
      res.status(500).send("Error en la inserción de transito");
  }
}

module.exports = {
   createDespacho,
   ultimoDespacho,
   getDespachos,
   getDespachosByDate
}


