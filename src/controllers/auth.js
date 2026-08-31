const {getConnection, sql} = require('../database/connection');
const jwt = require('jsonwebtoken')
const  bcrypt = require('bcrypt')

async function loginUser(req, res){
    const id = req.body.id;
    const username = req.body.username;
    const password = req.body.password;
    const pool = await getConnection();
    const result = await pool.request()
        .input("Nick", username)
        .query(`SELECT * FROM Usuarios where Nick = @Nick`)
    console.log(result.recordset[0])
    const response = result.recordset[0]
    console.log("response login", result.recordset[0]);
    if (result.recordset.length == 0) {
        res.send({ error: 'usuario no encontrado' })
    }else {
        const passwordCheck = await bcrypt.compare(password, result.recordset[0].Password)
        if (!passwordCheck) {
            res.send({ error: 'usuario no encontrado' })
        }else {
            jwt.sign({ id }, 'secret_key', (err, token) => {
                if (err) {
                    res.status(400).send({ error: 'jwt error' })
                }
                else {
                    res.send({
                        token: token, user: {
                            response
                        }
                    })
                }
            })
        }
        
    } 
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


async function getLimitToken(req, res){
    const pool = await getConnection();
    const result = await pool.request()
        .query(`select Valor from Configuraciones where Parametro = 'Token'`)
    const response = result.recordset
    res.json(response)
}

module.exports= {
    loginUser,
    registerUser,
    getLimitToken
}
