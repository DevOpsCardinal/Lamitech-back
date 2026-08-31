const {getConnection, sql} = require('../database/connection');

async function traerPlanta(req, res){
   try {
      console.log(req.body);
      const busqueda = req.body.busqueda
      const valor = req.body.valor
      const query = `SELECT * FROM Plantas WHERE ${busqueda}=@Valor`
      const pool = await getConnection();
      const result = await pool.request()
      .input("Valor", sql.VarChar, valor)
      .query(query)
      const response = result.recordset
      res.json(response)
   } catch (error) {
      console.log(error.message);
      res.send({error: 'No se encontró el registro'})
   }
}

async function updatePlanta(req, res){
   try {
      console.log(req.body);
      const pool = await getConnection();
      const result = await pool.request()
      .input('Codigo', sql.VarChar, req.body.codigo)
      .input('Nombre', sql.VarChar, req.body.nombre)
      .input('Detalles', sql.VarChar, req.body.detalles)
      .query(`UPDATE Plantas SET Nombre=@Nombre, Detalles=@Detalles 
      WHERE Codigo=@Codigo`)
      res.send({result})
      console.log({result});
   } catch (error) {
      console.log(error.message);
   }
}

async function getPlantas(req, res){
   const pool = await getConnection();
   const result = await pool.request().query('SELECT * FROM Plantas')
   const response = result.recordset
   res.json(response)
}

async function createPlantas(req, res){
   try {
      const pool = await getConnection();
      const result = await pool.request()
         .input("Codigo", sql.Int, req.body.codigo)
         .input("Nombre", sql.VarChar, req.body.nombre)
         .input("Detalles", sql.VarChar, req.body.detalles)
         .query(`INSERT INTO Plantas
            (Codigo, Nombre, Detalles)
            VALUES
            (@Codigo, @Nombre, @Detalles)`)
      console.log(result)
      res.send({ result })
   } catch (error) {
      console.log(error.message);
      res.send({ error: "No se guardo el registro" })
   }
}

module.exports = {
   traerPlanta,
   updatePlanta,
   createPlantas,
   getPlantas
}

