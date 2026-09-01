
const {getConnection, sql} = require('../database/connection')
const {sendMail} = require('../mail/transito')
const {CrearPdf} = require('../mail/crearArchivoPdf')
const {createSftp} = require('../mail/sftp')
const {cerrarTrailer, registrarTaraVehiculo, pesoTrailerParaCarga} = require('../servicios/trailer')
const {vgm, cargaReal} = require('../calculos/pesos')

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

      // El trailer viaja en uno solo de los dos pesajes: el vehiculo entra sin
      // el y sale con el (recoger) o al reves (descargar). En ambos casos el
      // neto incluye el peso del trailer y hay que descontarlo, asi que hay que
      // conocerlo antes de insertar el tiquete.
      const netoIncluyeTrailer = procesoRecoger == true || procesoDescargar == true;

      let pesoTrailerConocido = null;
      if (netoIncluyeTrailer) {
         try {
            pesoTrailerConocido = await pesoTrailerParaCarga(pool, {
               trailer: n_R,
               usarViajeEnCurso: procesoRecoger == true,
            });
         } catch (errorTrailer) {
            console.error('No se pudo leer el peso del trailer:', errorTrailer);
         }
      }

      const cargaDelMovimiento = cargaReal({
         neto,
         pesoTrailer: pesoTrailerConocido,
         incluyeTrailer: netoIncluyeTrailer,
      });

      const query = `
          INSERT INTO Despachos
          (Placa, Conductor, Cedula, Producto, Planta, Cliente, 
           Destino, Transportadora, Fecha_Peso_Vacio, Hora_Peso_Vacio, 
           Fecha_Peso_Lleno, Hora_Peso_Lleno, Bruto, Tara, Neto, No_Tiquete, Operario, Nick_Operario, 
           No_Shipment, No_Sello, No_R, No_Contenedor, Observaciones, Tara_Contenedor, Responsable, Neto_Contenedor, Fecha_Entrada, Vgm, Carga)
          VALUES 
          (@Placa, @Conductor, @Cedula, @Producto, @Planta, @Cliente, 
           @Destino, @Transportadora, @Fecha_Peso_Vacio, @Hora_Peso_Vacio, 
           FORMAT(GETDATE(), 'yyyy-MM-dd'), FORMAT(GETDATE(), 'HH:mm'),
           @Bruto, @Tara, @Neto, @No_Tiquete, @Operario, @Nick_Operario, 
           @No_Shipment, @No_Sello, @No_R, @No_Contenedor, @Observaciones, @Tara_Contenedor, @Responsable, @Neto_Contenedor, @Fecha_Entrada, @Vgm, @Carga)`;

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
          .input('Carga', sql.Int, cargaDelMovimiento)
          .input('Vgm', sql.Int, vgm({ taraContenedor: tara_contenedor, carga: cargaDelMovimiento, noContenedor: n_contenedor }))
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
                // Se lleva el trailer. El conjunto con trailer es bruto y el
                // vehiculo solo es tara (en la otra ruta van al reves).
                await cerrarTrailer(pool, {
                   trailer: n_R,
                   placa,
                   pesoConjuntoSalida: bruto,
                   taraVehiculoSalida: tara,
                });
             } else {
                // El vehiculo se peso solo: su tara alimenta la determinacion que
                // este libre. Incluye el caso de DESCARGAR, donde el vehiculo
                // llego con el trailer y sale sin el -antes esta rama no hacia
                // nada y el extremo de entrada se quedaba sin determinar, asi
                // que al recogerlo despues no habia con que descontar el
                // trailer y el tiquete salia en blanco.
                await registrarTaraVehiculo(pool, {
                   trailer: n_R,
                   taraVehiculo: bruto,
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


