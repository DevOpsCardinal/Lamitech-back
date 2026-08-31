
const {getConnection, sql} = require('../database/connection')
const {sendMail} = require('../mail/transito')
const {CrearPdf} = require('../mail/crearArchivoPdf')
const {createSftp} = require('../mail/sftp')


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
           No_Shipment, No_Sello, No_R, No_Contenedor, Observaciones, Tara_Contenedor, Responsable, Neto_Contenedor, Fecha_Entrada)
          VALUES 
          (@Placa, @Conductor, @Cedula, @Materia_Prima, @Planta, @Proveedor, 
           @Origen, @Transportadora, FORMAT(GETDATE(), 'yyyy-MM-dd'), FORMAT(GETDATE(), 'HH:mm'),
           @Fecha_Peso_lleno, @Hora_Peso_lleno, @Bruto, @Tara, @Neto, @No_Tiquete, @Operario, @Nick_Operario, 
           @No_Shipment, @No_Sello, @No_R, @No_Contenedor, @Observaciones, @Tara_Contenedor, @Responsable, @Neto_Contenedor, @Fecha_Entrada)`;

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
          

          if (procesoRecoger == true) {
            const checkTrailerQuery = `
                       SELECT TOP 1 *
                       FROM Trailers
                       WHERE Trailer = @Trailer
                       ORDER BY Fecha_Entrada DESC`; // Asumo que tienes una columna de fecha para ordenar
        
            const checkTrailer = await pool
              .request()
              .input('Trailer', sql.VarChar, n_R)
              .query(checkTrailerQuery);
            console.log('checkTrailer: ', checkTrailer);

            if (checkTrailer.recordset.length > 0) {
               const { Culminado } = checkTrailer.recordset[0];
         
               console.log('mayor a cero');
         
               if (Culminado == false) {
                 // Si el proceso no ha culminado, no se hace nada
                 const queryUpdateTrailer = `update Trailers set Fecha_Salida = FORMAT(GETDATE(), 'yyyy-MM-dd'), Hora_Salida = FORMAT(GETDATE(), 'HH:mm'), Placa_Salida = @Placa, Peso_Salida= @Peso, taraCab2 = @tara , Culminado = 1 where Trailer = @Trailer and Culminado = 0`
                 const updateTrailer = await pool
                  .request()
                  .input('Trailer', sql.VarChar, n_R)
                  .input('Placa', sql.VarChar, placa)
                  .input('peso', sql.Int, tara)
                  .input('tara', sql.Int, tara)


                  .query(queryUpdateTrailer);
                  console.log('checkTrailer: ', updateTrailer);
               }
             }
          }else if(procesoDescargar == true){
           
          }else{
            const checkTrailerQuery = `
            SELECT TOP 1 *
            FROM Trailers
            WHERE Trailer = @Trailer
            ORDER BY Fecha_Entrada DESC`; // Asumo que tienes una columna de fecha para ordenar

            const checkTrailer = await pool
               .request()
               .input('Trailer', sql.VarChar, n_R)
               .query(checkTrailerQuery);
            console.log('checkTrailer: ', checkTrailer);

            if (checkTrailer.recordset.length > 0) {
               const {Peso_Entrada, Culminado,  taraCab1, taraCab2, Peso_Trailer} = checkTrailer.recordset[0];
               console.log("checkTrailer.recordset[0]", checkTrailer.recordset[0]);
               console.log('mayor a cero');
               console.log('culminado', Culminado);
               console.log('taraCab1', taraCab1);
               console.log('taraCab2', taraCab2);
               
               
         
             
         
               if (Culminado == false) {

                  if(taraCab1 == null){
                     const Trailer = parseInt(Peso_Entrada) - (parseInt(tara) + parseInt(Peso_Trailer))
                     // Si el proceso no ha culminado, no se hace nada
                     const queryUpdateTrailer = `update Trailers set taraCab1 = @tara,  Peso_Trailer = @peso where Trailer = @Trailer and Culminado = 0`
                     const updateTrailer = await pool
                      .request()
                      .input('Trailer', sql.VarChar, n_R)
                      .input('Placa', sql.VarChar, placa)
                      .input('peso', sql.Int, Trailer)
                      .input('tara', sql.Int, tara)
    
    
    
                      .query(queryUpdateTrailer);
                      console.log('checkTrailer: ', updateTrailer);
                  } else {
                     const Trailer = parseInt(Peso_Entrada) - (parseInt(tara) + parseInt(Peso_Trailer))
                     // Si el proceso no ha culminado, no se hace nada
                     const queryUpdateTrailer = `update Trailers set taraCab2 = @tara,  Peso_Trailer = @peso where Trailer = @Trailer and Culminado = 0`
                     const updateTrailer = await pool
                      .request()
                      .input('Trailer', sql.VarChar, n_R)
                      .input('Placa', sql.VarChar, placa)
                      .input('peso', sql.Int, Trailer)
                      .input('tara', sql.Int, tara)
    
    
    
                      .query(queryUpdateTrailer);
                      console.log('checkTrailer: ', updateTrailer);
                  }
               }
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