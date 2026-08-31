const {getConnection, sql} = require('../database/connection')

async function traerTransportadora(req, res){
    try{
        console.log(req.body);
        const busqueda = req.body.busqueda
        const valor = req.body.valor
        const query = `SELECT * FROM Transportadoras WHERE ${busqueda}=@Valor`
        const pool = await getConnection();
        const  result = await pool.request()
        .input("Valor", sql.VarChar, valor)
        .query(query)
        const response = result.recordset
        res.json(response)
    }catch(error){
        res.send({error: 'No se encontró el registro'})
    }
}

async function getTransportadoras(req, res){
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Transportadoras')
    const response = result.recordset
    res.json(response)
}


async function createTransportadoras(req, res){
    try {
        console.log(req.body);
        const pool = await getConnection();
        const result = await pool.request()
            .input("Nit", sql.VarChar, req.body.nit)
            .input("Nombre", sql.VarChar, req.body.nombre)
            .input("Direccion", sql.VarChar, req.body.direccion)
            .input("Telefono", sql.VarChar, req.body.telefono)
            .input("Fax", sql.VarChar, '')
            .input("Observaciones", sql.VarChar, req.body.observaciones)
            .query(`INSERT INTO Transportadoras
            (Nit, Nombre, Direccion, Telefono,Fax, Observaciones)
            VALUES
            (@Nit, @Nombre, @Direccion, @Telefono,@Fax, @Observaciones)`)
        res.send({ result })
    } catch (error) {
        res.send({ error: "No se guardo el registro" })
    }



}

async function updateTransportadora(req, res){
    try{
        console.log(req.body);
        const pool = await getConnection();
        const result = await pool.request()
        .input('NIT', sql.VarChar, req.body.nit)
        .input("Nombre", sql.VarChar, req.body.nombre)
        .input('Direccion', sql.VarChar, req.body.direccion)
        .input('Telefono', sql.VarChar, req.body.telefono)
        .input("Fax", sql.VarChar, '')
        .input('Observaciones', sql.VarChar, req.body.observaciones)
        .query(`UPDATE Transportadoras
                SET Nombre=@Nombre, Direccion=@Direccion, Telefono=@Telefono, Observaciones=@Observaciones 
                WHERE NIT=@NIT`)
        res.send({result})
        console.log({result});
    }catch(error){
        console.log(error.message);
    }
}

module.exports = {
    traerTransportadora,
    getTransportadoras,
    createTransportadoras,
    updateTransportadora
}