


const {getConnection, sql} = require('../database/connection')

async function getVehiculos(req, res){
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Vehiculos')
    const response = result.recordset
    res.json(response)
}

async function createVehiculo(req, res){
    console.log(req.body)
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("Placa", sql.VarChar, req.body.placa)
            .input("Tipo", sql.VarChar, req.body.tipo)
            .input("SOAT", sql.VarChar, '')
            .input("FechaSOAT", sql.Date, '12-12-2023')
            .input("Tecnomecanica", sql.VarChar, '')
            .input("FechaTecno", sql.Date, '12-12-2023')
            .query(`INSERT INTO Vehiculos
            (Placa, Tipo, SOAT, FechaSOAT, Tecnomecanica, FechaTecno)
            VALUES
            (@Placa, @Tipo, @SOAT, @FechaSOAT, @Tecnomecanica, @FechaTecno)`)
        res.send({ result })
    } catch (error) {
        res.send({ error: "No se guardo el registro" })
    }
}

module.exports = {
    getVehiculos,
    createVehiculo
}

