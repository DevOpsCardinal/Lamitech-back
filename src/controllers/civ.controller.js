import { getConnection, sql } from "../database/connection";
const jwt = require('jsonwebtoken')

export const getCiv = async (req, res) => {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM CodigoIdentificacionVial')
    const response = result.recordset
    res.json(response)
}


export const createCiv = async (req, res) => {

    console.log(req.body)

    try {

        const pool = await getConnection();
        const result = await pool.request()
            .input("Civ", sql.VarChar, req.body.civ)
            .input("NombreEjeVia", sql.VarChar, req.body.nombreEjeVia)
            .input("NombreExtremoInicial", sql.VarChar, req.body.nombreExtremoInicial)
            .input("NombreExtremoFinal", sql.VarChar, req.body.nombreExtremoFinal)
            .input("TipoMalla", sql.VarChar, req.body.tipoMalla)
            .query(`INSERT INTO CodigoIdentificacionVial
            (Civ, NombreEjeVia, NombreExtremoInicial, NombreExtremoFinal, TipoMalla)
            
            VALUES
            
            (@Civ, @NombreEjeVia, @NombreExtremoInicial, @NombreExtremoFinal, @TipoMalla)`)


        res.send({ result })
    } catch (error) {
        res.send({ error: "No se guardo el registro" })
    }
}