
const {getConnection, sql} = require('../database/connection')
const {sendMail} = require('../mail/transito')
const {CrearPdf} = require('../mail/crearArchivoPdf')
const {createSftp} = require('../mail/sftp')
const {cerrarTrailer, registrarTaraCabezote} = require('../servicios/trailer')
const {vgm} = require('../calculos/pesos')

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

async function getDespachosByPlaca(req, res){
   const {placa} = req.body
   console.log("getDespachosByPlaca: ", placa);
   
   const pool = await getConnection();
   const result = await pool.request().input('placa', sql.VarChar, placa).query(`SELECT TOP (1) * FROM Despachos where Placa like = '%${placa}%' order by No_Tiquete desc`)
   const response = result.recordset
   res.json(response)
}

async function ultimaSalida(req, res){
   console.log("req.body: ", req.body);

   const {proceso, valor} = req.body

 
      const pool = await getConnection();
      const result = await pool.request()
      .input('valor', sql.VarChar, valor) // Ajusta el tipo de dato si es necesario
      .query(`
        UPDATE ${proceso}
        SET Fecha_salida = FORMAT(GETDATE(), 'yyyy-MM-dd'), Hora_salida = FORMAT(GETDATE(), 'HH:mm')
        WHERE Placa = @valor AND No_Tiquete = (
          SELECT TOP 1 No_Tiquete
          FROM ${proceso}
          WHERE Placa = @valor
          ORDER BY No_Tiquete DESC
        )
      `);

         const response = result
         console.log(response);
         
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
          responsable,
          fecha_entrada
      } = req.body.formValue;

      const { bruto, tara, neto, operario, nickOperario, fechaIngreso, horaIngreso, procesoRecoger, procesoDescargar } = req.body;

      const query = `
          INSERT INTO Despachos
          (Placa, Conductor, Cedula, Producto, Planta, Cliente, 
           Destino, Transportadora, Fecha_Peso_Vacio, Hora_Peso_Vacio, 
           Fecha_Peso_Lleno, Hora_Peso_Lleno, Bruto, Tara, Neto, No_Tiquete, Operario, Nick_Operario, 
           No_Shipment, No_Sello, No_R, No_Contenedor, Observaciones, Tara_Contenedor, Responsable, Neto_Contenedor, Fecha_Entrada, Vgm)
          VALUES 
          (@Placa, @Conductor, @Cedula, @Producto, @Planta, @Cliente, 
           @Destino, @Transportadora, @Fecha_Peso_Vacio, @Hora_Peso_Vacio, 
           FORMAT(GETDATE(), 'yyyy-MM-dd'), FORMAT(GETDATE(), 'HH:mm'),
           @Bruto, @Tara, @Neto, @No_Tiquete, @Operario, @Nick_Operario, 
           @No_Shipment, @No_Sello, @No_R, @No_Contenedor, @Observaciones, @Tara_Contenedor, @Responsable, @Neto_Contenedor, @Fecha_Entrada, @Vgm)`;

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
          // VGM (SOLAS VI/2) = tara del contenedor + carga. Se persiste el valor
          // emitido para que la reimpresion muestre lo declarado, no un recalculo.
          .input('Vgm', sql.Int, vgm({ taraContenedor: tara_contenedor, neto }))
          .input(
            'Fecha_Entrada',
            sql.VarChar,
            procesoRecoger == true
              ? 'Recoger_Trailer'
              : procesoDescargar == true
              ? 'Descargar_Trailer'
              : fecha_entrada
          )
          .query(query);


          // Movimientos de trailer. La logica vive en servicios/trailer.js para
          // que despachos e ingresos calculen exactamente igual.
          //
          // Va en su propio try: el registro del trailer es auxiliar y un fallo
          // aqui no debe tumbar el tiquete. Antes cualquier error se propagaba
          // al catch general, el despacho quedaba insertado pero updateConteo no
          // llegaba a correr y el consecutivo de tiquete se repetia.
          try {
             if (procesoRecoger == true) {
                // Se lleva el trailer: el peso del conjunto a la salida es el bruto.
                await cerrarTrailer(pool, {
                   trailer: n_R,
                   placa,
                   pesoConjuntoSalida: bruto,
                });
             } else if (procesoDescargar == true) {
                // La fila del trailer se crea en el primer pesaje (transito).
             } else {
                // Cabezote pesado solo: alimenta una de las dos determinaciones.
                // En un despacho el pesaje que se acaba de hacer es el bruto
                // (el segundo), no la tara, que viene arrastrada del transito.
                await registrarTaraCabezote(pool, {
                   trailer: n_R,
                   taraCabezote: bruto,
                });
             }
          } catch (errorTrailer) {
             console.error('Error al registrar el movimiento de trailer:', errorTrailer);
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
   getDespachosByDate, 
   ultimaSalida,
   getDespachosByPlaca
}


