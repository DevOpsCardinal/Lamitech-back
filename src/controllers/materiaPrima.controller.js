
const {getConnection, sql} = require('../database/connection')

async function traerMateriaPrima(req, res){
    try {
        console.log(req.body);
        const busqueda = req.body.busqueda
        const valor = req.body.valor
        const query = `SELECT * FROM Materias_Primas WHERE ${busqueda}=@Valor`
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

async function updateMateriaPrima(req, res){
    try {
        console.log(req.body);
        const pool = await getConnection();
        const result = await pool.request()
        .input('Codigo', sql.VarChar, req.body.codigo)
        .input('Nombre', sql.VarChar, req.body.nombre)
        .input('Detalles', sql.VarChar, req.body.detalles)
        .query(`UPDATE Materias_Primas 
        SET Nombre=@Nombre, Detalles=@Detalles
        WHERE Codigo=@Codigo`)
        res.send({result})
        console.log({result});
    } catch (error) {
        console.log(error.message);
    }
}

async function getMateriasPrimas(req, res){
    const pool = await getConnection();
    const result = await pool.request().query(`
   select * from Materias_Primas`)
    const response = result.recordset
    res.json(response)
}


async function createMateriaPrima(req, res){
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("Codigo", sql.Int, req.body.codigo)
            .input("Nombre", sql.VarChar, req.body.nombre)
            .input("Detalles", sql.VarChar, req.body.detalles)
            .query(`INSERT INTO Materias_Primas
            (Codigo, Nombre, Detalles)
            VALUES
            (@Codigo, @Nombre, @Detalles)`)
        res.send({ result })
    } catch (error) {
        console.log(error.message);
        res.send({ error: "No se guardo el registro" })
    }
}

module.exports = {
    traerMateriaPrima,
    updateMateriaPrima,
    getMateriasPrimas,
    createMateriaPrima
}
