const {getConnection, sql} = require('../database/connection')
const jwt = require('jsonwebtoken')

async function getConductores  (req, res){
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Conductores')
    const response = result.recordset
    res.json(response)
}


async function createConductor(req, res){
    try {
        const estado = req.body.estado == true ? "Activo" : "Inactivo"
        const pool = await getConnection();
        const result = await pool.request()
            .input("Cedula", sql.Int, req.body.cedula)
            .input("Nombre", sql.VarChar, req.body.nombre)
            .input("Estado", sql.VarChar, estado)
            .query(`INSERT INTO Conductores
            (Cedula, Nombre, Estado  )
            
            VALUES
            
            (@Cedula, @Nombre, @Estado)`)
        res.send({ result })
    } catch (error) {
        console.log(error.message);
        res.send({ error: "No se guardo el registro" })
    }
}

async function updateConductor(req, res){
    console.log("updateConductor", req.body);
    const estado = req.body.estado
    const pool = await getConnection();
    const result = await pool.request()
        .input("Cedula", sql.Int, req.body.cedula)
        .input("Nombre", sql.VarChar, req.body.nombre)
        .input("Estado", sql.VarChar, estado)
        .query(`update Conductores 
        set Nombre = @Nombre, Estado = @Estado
        where Cedula = @Cedula`)
    res.send({ result });
}

async function traerConductor(req, res){
    console.log(req.body);
    try {
        console.log(req.body)
        const busqueda = req.body.busqueda
        const valor = req.body.valor
        const query = `select * from Conductores where ${busqueda} = @Valor `
        const pool = await getConnection();
        const result = await pool.request()
            .input("Valor", sql.VarChar, valor)
            .query(query)
        const response = result.recordset
        console.log(response)
        res.json(response)
    } catch (error) {
        res.send({ error: "No se guardo el registro" })
    }
}


module.exports = {
    getConductores,
    createConductor,
    updateConductor,
    traerConductor
}

