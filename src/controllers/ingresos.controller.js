
const {getConnection, sql} = require('../database/connection')
const {sendMail} = require('../mail/transito')
const {CrearPdf} = require('../mail/crearArchivoPdf')
const {createSftp} = require('../mail/sftp')
const {cerrarTrailer, registrarTaraCabezote} = require('../servicios/trailer')
const {vgm} = require('../calculos/pesos')


async function updateConteo(noTiquete){
   const pool = await getConnection();
   const result = await pool.request()
      .input("Valor", sql.VarChar, `${noTiquete}`)
      .query("update Configuraciones set Valor  = @Valor where Parametro = 'No_Tiquete_Ingresos'")
   const response = result.recordset
   console.log(response)
   return response
}
async function countTransito2(req, res){
   const pool = await getConnection();
   const result = await pool.request().query("select Valor from Configuraciones where Parametro = 'No_Tiquete_Ingresos'")
   const response = result.recordset
   console.log(response)
   return response
}


async function countTransito(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT TOP (1) No_Tiquete FROM Vehiculos_en_Transito order by No_Tiquete desc')
   const response = result.recordset
   console.log(response)
   res.json(response)
}

async function countMaterias(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT TOP (1) No_Tiquete FROM Ingresos order by No_Tiquete desc')
   const response = result.recordset
   console.log(response)
   res.json(response)
}

async function getMaterias(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT TOP (100) * FROM Ingresos order by No_Tiquete desc')
   const response = result.recordset
   res.json(response)
   console.log(response)
}

async function getMateriasByDate(req, res){
    const proceso = req.body.proceso
    if (req.body.busqueda == null || req.body.busqueda == "") {
       const fechaInicial = req.body.fechaInicial
       const fechaFinal = req.body.fechaFinal
       const valor = req.body.valor
       const query = `select * from Ingresos where  Fecha_Peso_lleno between @fechaInicial and @fechaFinal order by No_Tiquete desc `
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
       const query = `select * from Ingresos where ${busqueda} = @Valor and Fecha_Peso_lleno between @fechaInicial and @fechaFinal order by No_Tiquete desc `
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
          .input("MetodoPago", sql.VarChar, proceso)
          .input("fechaFinal", sql.VarChar, fechaFinal)
          .input("Valor", sql.VarChar, valor)
          .query(`select * from Ingresos where  ${busqueda} = @Valor and Fecha_Peso_lleno between @fechaInicial and @fechaFinal order by No_Tiquete desc`)
       const response = result.recordset
       console.log(response)   
       res.json(response)
    }
}




 async function tiquete(){
   const pool = await getConnection();
   const result = await pool.request().query("select Valor from Configuraciones where Parametro = 'No_Tiquete_Ingresos'")
   const response = result.recordset
   return response
}

async function ultimoIngreso(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT TOP (1) * FROM Ingresos order by No_Tiquete desc')
   const response = result.recordset
   console.log("countDespachos",response)
   res.json(response)
}
 
async function createIngreso(req, res){
   console.log("BODY", req.body);
 
   const responseTiquete = await tiquete()
   const number = parseInt(responseTiquete?.[0].Valor)
   console.log("tiquete", number);
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
          INSERT INTO Ingresos
          (Placa, Conductor, Cedula, Materia_Prima, Planta, Proveedor, 
           Origen, Transportadora, Fecha_Peso_Vacio, Hora_Peso_Vacio, 
           Fecha_Peso_Lleno, Hora_Peso_Lleno, Bruto, Tara, Neto, No_Tiquete, Operario, Nick_Operario, 
           No_Shipment, No_Sello, No_R, No_Contenedor, Observaciones, Tara_Contenedor, Responsable, Neto_Contenedor, Fecha_Entrada, Vgm)
          VALUES 
          (@Placa, @Conductor, @Cedula, @Materia_Prima, @Planta, @Proveedor, 
           @Origen, @Transportadora, FORMAT(GETDATE(), 'yyyy-MM-dd'), FORMAT(GETDATE(), 'HH:mm'),
           @Fecha_Peso_lleno, @Hora_Peso_lleno, @Bruto, @Tara, @Neto, @No_Tiquete, @Operario, @Nick_Operario, 
           @No_Shipment, @No_Sello, @No_R, @No_Contenedor, @Observaciones, @Tara_Contenedor, @Responsable, @Neto_Contenedor, @Fecha_Entrada, @Vgm)`;

      const response = await pool.request()
          .input("Placa", sql.VarChar, placa)
          .input("Conductor", sql.VarChar, conductor)
          .input("Cedula", sql.Int, cedulaCiudadania)
          .input("Materia_Prima", sql.VarChar, productoMateria)
          .input("Planta", sql.VarChar, planta)
          .input("Proveedor", sql.VarChar, clienteProveedor)
          .input("Origen", sql.VarChar, destino)
          .input("Transportadora", sql.VarChar, transportadora)
          .input("Fecha_Peso_lleno", sql.VarChar, fechaIngreso)
          .input("Hora_Peso_lleno", sql.VarChar, horaIngreso)
          .input("Bruto", sql.Int, bruto == 'NaN' || bruto == null || bruto == 'null'  ? 0: bruto)
          .input("Tara", sql.Int, tara == 'NaN' || tara == null || tara == 'null' ? 0: tara)
          .input("Neto", sql.Int, neto == 'NaN' || neto == null  || neto == 'null' ? 0: neto)
          .input("No_Tiquete", sql.Int, parseInt(number) + 1)
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
          // VGM (SOLAS VI/2) = tara del contenedor + carga.
          .input('Vgm', sql.Int, vgm({ taraContenedor: tara_contenedor, neto }))
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

          console.log("procesoRecoger", procesoRecoger);
            console.log("procesoDescargar", procesoDescargar);
          

          // Movimientos de trailer. La logica vive en servicios/trailer.js para
          // que despachos e ingresos calculen exactamente igual.
          //
          // Va en su propio try: el registro del trailer es auxiliar y un fallo
          // aqui no debe tumbar el tiquete. Antes cualquier error se propagaba
          // al catch general, el despacho quedaba insertado pero updateConteo no
          // llegaba a correr y el consecutivo de tiquete se repetia.
          try {
             if (procesoRecoger == true) {
                // Se lleva el trailer. En un ingreso los pesajes van al reves
                // que en un despacho: el conjunto con trailer es la tara y el
                // vehiculo solo es el bruto.
                await cerrarTrailer(pool, {
                   trailer: n_R,
                   placa,
                   pesoConjuntoSalida: tara,
                   taraCabezoteSalida: bruto,
                });
             } else if (procesoDescargar == true) {
                // La fila del trailer se crea en el primer pesaje (transito).
             } else {
                // Cabezote pesado solo: alimenta una de las dos determinaciones.
                // En un ingreso el pesaje que se acaba de hacer es la tara
                // (el segundo); en un despacho es el bruto. De ahi la asimetria
                // entre este controlador y despachos.controller.js.
                await registrarTaraCabezote(pool, {
                   trailer: n_R,
                   taraCabezote: tara,
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

async function getIngresosByPlaca(req, res){
   const {placa} = req.body
   const pool = await getConnection();
   const result = await pool.request().input('placa', sql.VarChar, placa).query('SELECT TOP (1) * FROM Ingresos where Placa = @placa order by No_Tiquete desc')
   const response = result.recordset
   res.json(response)
}


module.exports = {
   updateConteo,
   countTransito2,
   countTransito,
   countMaterias,
   getMaterias,
   getMateriasByDate,
   createIngreso,
   ultimoIngreso,
   ultimoIngreso,
   getIngresosByPlaca
}