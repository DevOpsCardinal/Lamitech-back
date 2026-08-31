
const {getConnection, sql} = require('../database/connection')

async function getDestinos(req, res){
    try {
        const pool = await getConnection();
    const result = await pool.request().query(`
    select * from Destinos`)
    const response = result.recordset
    res.json(response)
    } catch (error) {
        console.log(error.message);
    }
}


async function createDestinos(req, res){
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("Codigo", sql.VarChar, req.body.codigo)
            .input("Nombre", sql.VarChar, req.body.nombre)
            .input("Detalles", sql.VarChar, req.body.detalles)
            .query(`INSERT INTO Destinos
            (Codigo, Nombre, Detalles)
            VALUES
            (@Codigo, @Nombre, @Detalles)`)
        console.log(result)
        res.send({ result })
    } catch (error) {
        res.send({ error: "No se guardo el registro" })
    }
}


async function traerDestino(req, res){
    try {
        console.log(req.body);
        const busqueda = req.body.busqueda
        const valor = req.body.valor
        const query = `SELECT * FROM Destinos WHERE ${busqueda}=@Valor`
        const pool = await getConnection();
        const result = await pool.request()
            .input("Valor", sql.VarChar, valor)
            .query(query)
        const response = result.recordset
        res.json(response)
    } catch (error) {
        console.log(error.message);
        res.send({ error: 'No se encontró el registro' })
    }
}


async function updateDestino(req, res){
    try {
        console.log(req.body);
        const pool = await getConnection();
        const result = await pool.request()
            .input('Codigo', sql.VarChar, req.body.codigo)
            .input('Nombre', sql.VarChar, req.body.nombre)
            .input('Detalles', sql.VarChar, req.body.detalles)
            .query(`UPDATE Destinos 
        SET Nombre=@Nombre, Detalles=@Detalles
        WHERE Codigo=@Codigo`)
        res.send({ result })
        console.log({ result });
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    getDestinos,
    createDestinos,
    traerDestino,
    updateDestino
}
