
const {getConnection, sql} = require('../database/connection.js')
const jwt = require('jsonwebtoken')

async function traerCliente(req, res){
    try {
        console.log(req.body)
        const busqueda = req.body.busqueda
        const valor = req.body.valor
        const query = `select * from Clientes where ${busqueda} = @Valor `
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

async function getClientes(req, res){
    const pool = await getConnection();
    const result = await pool.request().query(`select * from Clientes`)
    const response = result.recordset
    res.json(response)
}

async function createCliente(req, res){
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("Nit", sql.Int, req.body.nit)
            .input("Nombre", sql.VarChar, req.body.nombre)
            .input("Direccion", sql.VarChar, req.body.direccion)
            .input("Telefono", sql.VarChar, req.body.telefono)
            .input("Observaciones", sql.VarChar, req.body.observaciones)
            .input("Fax", sql.VarChar, " ")
            .query(`INSERT INTO Clientes
            (Nit, Nombre, Direccion, Telefono, Observaciones, Fax)
            VALUES
            (@Nit, @Nombre, @Direccion, @Telefono, @Observaciones, @Fax)`)
        res.send({ result })
    } catch (error) {
        console.log(error.message);
        res.send({ error: "No se guardo el registro" })
    }
}

async function updateCliente(req, res){
    console.log(req.body)
    const pool = await getConnection();
    const result = await pool.request()
        .input("Nit", sql.VarChar, req.body.nit)
        .input("Nombre", sql.VarChar, req.body.nombre)
        .input("Direccion", sql.VarChar, req.body.direccion)
        .input("Telefono", sql.VarChar, req.body.telefono)
        .input("Observaciones", sql.VarChar, req.body.observaciones)
        .input("Factura_Electronica", sql.Bit, 1)
        .input("Fax", sql.VarChar, " ")
        .query(`update Clientes 
            set Nombre = @Nombre, Direccion = @Direccion, Telefono = @Telefono, Fax = @Fax, Observaciones = @Observaciones
            where NIT = @Nit`)
    res.send({ result })
}

module.exports = {
    traerCliente,
    getClientes,
    createCliente,
    updateCliente
}

