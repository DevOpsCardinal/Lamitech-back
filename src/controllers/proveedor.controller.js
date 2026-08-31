
const {getConnection, sql} = require('../database/connection')

async function traerProveedor(req, res){
 try {
    console.log(req.body);
    const busqueda = req.body.busqueda
    const valor = req.body.valor
    const query = `SELECT * FROM Proveedores WHERE ${busqueda}=@Valor`
    const pool = await getConnection();
    const result = await pool.request()
    .input("Valor", sql.VarChar, valor)
    .query(query)
    const response = result.recordset
    res.json(response)
 } catch (error) {
  console.log(error.message);
  res.send({error: 'no se pudo encontrar el registro'})
 }
}

async function getALlProveedor(req, res){
    const pool = await getConnection();
    const result = await pool.request().query(`
    select * from Proveedores`)
    const response = result.recordset
    res.json(response)
 }

 async function createProveedor(req, res){
  try {
    console.log(req.body.data);//no está llegando nit?
    const pool = await getConnection();
    const result = await pool.request()
      .input("NIT", sql.VarChar, req.body.data.nit)
      .input("Nombre", sql.VarChar, req.body.data.nombre)
      .input("Direccion", sql.VarChar, req.body.data.direccion)
      .input("Telefono", sql.VarChar, req.body.data.telefono) //telefono
      .input("Fax", sql.VarChar, "")
      .input("Observaciones", sql.VarChar, req.body.data.observaciones)
      .query(`INSERT INTO Proveedores
        (NIT, Nombre, Direccion, Telefono, Fax, Observaciones)  
        VALUES
        (@NIT, @Nombre, @Direccion, @Telefono, @Fax, @Observaciones)`) 
    res.send({result});
  } catch (error) {
    console.log(error.message);
    res.send({ error: "No se pudo crear el registro" });
  }
};


async function updateProveedor(req, res){
  try {
    console.log(req.body);
    const pool = await getConnection();
    const result = await pool.request()
    .input('NIT', sql.VarChar, req.body.nit)
    .input("Nombre", sql.VarChar, req.body.nombre)
    .input('Direccion', sql.VarChar, req.body.direccion)
    .input('Telefono', sql.VarChar, req.body.telefono)
    .input("Fax", sql.VarChar, '')
    .input('Observaciones', sql.VarChar, req.body.observaciones)
    .query(`UPDATE Proveedores
     SET Nombre=@Nombre, Direccion=@Direccion, Telefono=@Telefono, Fax=@Fax, Observaciones=@Observaciones
     WHERE NIT=@NIT`)
     res.send({result})
     console.log({result});
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  traerProveedor,
  getALlProveedor,
  createProveedor,
  updateProveedor
}
