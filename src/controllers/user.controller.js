const {getConnection, sql} = require('../database/connection');
const jwt = require('jsonwebtoken')
const  bcrypt = require('bcrypt')


async function getUsers(req, res){
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Usuarios')
    res.json(result.recordset)
}

async function registerUser(req, res){
    console.log(req.body)
    try {
        const hashedPassword = bcrypt.hashSync(req.body.password, 10)
        const pool = await getConnection();
        const result = await pool.request()
        .input("Cedula", sql.Int, parseInt(req.body.cedula))
            .input("Apellido", sql.VarChar, req.body.apellido)
            .input("Nick", sql.VarChar, req.body.username)
            .input("Tipo", sql.VarChar, req.body.rango == '100' ? 'Administrador' : 'Operario')
            .input("Password", sql.VarChar, `${String(hashedPassword)}`)
            .input("Nombre", sql.VarChar, req.body.nombre)
            .input("estado", sql.VarChar, `${req.body.estado}`)
            .input("rango", sql.Int, parseInt(req.body.rango))
            .query(`INSERT INTO Usuarios
            (Cedula, Apellido, Nick, Tipo, Password, estado, Nombre, rango)
            VALUES
            (@Cedula, @Apellido, @Nick, @Tipo, @Password, @estado, @Nombre, @rango)`)
        res.send({ result })
    } catch (error) {
        res.send({ error: "No se guardo el registro" })
        console.log(error.message);
    }

}

async function updateUser(req, res) {
    console.log(req.body);
    try {
        
    
    if (req.body.password) {
            const hashedPassword = bcrypt.hashSync(req.body.password, 10)
            const pool = await getConnection();
            const result = await pool.request()
                .input("Id", sql.Int, req.body.id)
                .input("Cedula", sql.Int, req.body.cedula)
                .input("Apellido", sql.VarChar, req.body.apellido)
                .input("Nick", sql.VarChar, req.body.username)
                .input("Tipo", sql.VarChar, req.body.rango == '100' ? 'Administrador' : 'Operario')
                .input("Password", sql.VarChar, `${String(hashedPassword)}`)
                .input("Nombre", sql.VarChar, req.body.nombre)
                .input("estado", sql.VarChar, `${req.body.estado}`)
                .input("rango", sql.Int, parseInt(req.body.rango))
                .query(`update [Usuarios] set 
                Cedula = @Cedula, 
                Nombre = @Nombre, 
                Apellido = @Apellido, 
                Nick = @Nick, 
                Tipo = @Tipo, 
                estado= @estado,
                rango= @rango,
                password = @password
                where Cedula = @Id`)
            res.send({ result })
        } else {
            const pool = await getConnection();
            const result = await pool.request()
                .input("Id", sql.Int, req.body.id)
                .input("Cedula", sql.Int, req.body.cedula)
                .input("Apellido", sql.VarChar, req.body.apellido)
                .input("Nick", sql.VarChar, req.body.username)
                .input("Tipo", sql.VarChar, req.body.rango == '100' ? 'Administrador' : 'Operario')
                .input("Nombre", sql.VarChar, req.body.nombre)
                .input("estado", sql.VarChar, `${req.body.estado}`)
                .input("rango", sql.Int, parseInt(req.body.rango))
                .query(`update [Usuarios] set 
                    Cedula = @Cedula, 
                    Nombre = @Nombre, 
                    Apellido = @Apellido, 
                    Nick = @Nick, 
                    Tipo = @Tipo, 
                    estado= @estado,
                    rango= @rango
                    
                    where Cedula = @Id`)
            res.send({ result })
        }
    } catch (error) {
            console.log(error);
    }
}





module.exports = {
    getUsers,
    updateUser,
    registerUser
}


