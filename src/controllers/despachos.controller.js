
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
              : fecha_entrada
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
                 const queryUpdateTrailer = `  update Trailers set Fecha_Salida = FORMAT(GETDATE(), 'yyyy-MM-dd'), Hora_Salida = FORMAT(GETDATE(), 'HH:mm'), Placa_Salida = @Placa, Peso_Salida= @Peso, taraCab2 = @tara , Culminado = 1  where Trailer = @Trailer and Culminado = 0`
                 const updateTrailer = await pool
                  .request()
                  .input('Trailer', sql.VarChar, n_R)
                  .input('Placa', sql.VarChar, placa)
                  .input('peso', sql.Int, bruto)
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
                     console.log('Peso_Entrada', Peso_Entrada);
                     console.log('taraCab1', taraCab1);
                     console.log('Peso_Trailer', Peso_Trailer);
                     const Trailer = parseInt(Peso_Entrada) - (parseInt(taraCab1) + parseInt(Peso_Trailer))
                     // Si el proceso no ha culminado, no se hace nada
                     const queryUpdateTrailer = `update Trailers set taraCab1 = @tara, Gross_Entrada = @Gross, Peso_Trailer = @peso where Trailer = @Trailer and Culminado = 0`
                     const updateTrailer = await pool
                      .request()
                      .input('Trailer', sql.VarChar, n_R)
                      .input('Placa', sql.VarChar, placa)
                      .input('peso', sql.Int, Trailer)
                      .input('Gross', sql.Int, bruto)
                      .input('tara', sql.Int, tara)
    
    
    
                      .query(queryUpdateTrailer);
                      console.log('checkTrailer: ', updateTrailer);
                  } else {
                     console.log('Peso_Entrada', Peso_Entrada);
                     console.log('taraCab1', taraCab1);
                     console.log('Peso_Trailer', Peso_Trailer);


                     const Trailer = parseInt(Peso_Entrada) - (parseInt(taraCab1) + parseInt(Peso_Trailer))
                     // Si el proceso no ha culminado, no se hace nada
                     const queryUpdateTrailer = `update Trailers set taraCab2 = @tara, Gross_Entrada = @Gross, Peso_Trailer = @peso where Trailer = @Trailer and Culminado = 0`
                     const updateTrailer = await pool
                      .request()
                      .input('Trailer', sql.VarChar, n_R)
                      .input('Placa', sql.VarChar, placa)
                      .input('peso', sql.Int, Trailer)
                      .input('Gross', sql.Int, bruto)
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

module.exports = {
   createDespacho,
   ultimoDespacho,
   getDespachos,
   getDespachosByDate, 
   ultimaSalida,
   getDespachosByPlaca
}


