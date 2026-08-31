const {getConnection, sql} = require('../database/connection')

async function cambiarTrama(req, res){
    const trama = req.body.trama;
    const pool = await getConnection();
    const result = await pool.request()
        .input("Trama", sql.VarChar, trama)
        .query(`UPDATE Configuraciones SET Valor = @Trama WHERE Parametro = 'Indicador1'`)
    const response = result

    response.rowsAffected ? res.json({ message: "Trama cambiada Exitosamente" }) : res.json({ error: "error de conexion" })
}

async function traerTrama(req, res){
    const pool = await getConnection();
    const result = await pool.request()
        .query(`select Valor from Configuraciones where Parametro = 'Indicador1'`)
    const response = result.recordset
    res.json(response)
}

async function basculas(req, res){
    const pool = await getConnection();
    const result = await pool.request()
        .query(`select Valor from Configuraciones where Parametro = '2basculas'`)
    const response = result.recordset
    res.json(response)
}


async function traerCom(req, res){
    const pool = await getConnection();
    const result = await pool.request()
        .batch(`select Valor from Configuraciones where Parametro = 'Port_Name1'; 
                select Valor from Configuraciones where Parametro = 'Port_Name2';`)
    const response = result.recordsets
    console.log("traerCom", response);
    res.json(response)
}

async function traerCom1(){
    const pool = await getConnection();
    const result = await pool.request()
        .query(`select Valor from Configuraciones where Parametro = 'Port_Name1'`)
    return result.recordset
}


async function traerCom2(){
    const pool = await getConnection();
    const result = await pool.request()
        .query(`select Valor from Configuraciones where Parametro = 'Port_Name2'`)
    return result.recordset
}


async function cambiarCom(req, res){
    console.log("cambiarCom",req.body);
    const basculas = req.body.basculas
    if(basculas == '0'){
        const com = req.body.com.com;
        const pool = await getConnection();
        const result = await pool.request()
            .input("Com", sql.VarChar, `${com}`)
            .query(`UPDATE Configuraciones SET Valor = @Com WHERE Parametro = 'Port_Name1'; UPDATE Configuraciones SET Valor = '0' WHERE Parametro = '2basculas'`)
        const response = result
        console.log(response);
        response.rowsAffected ? res.json({ message: "Trama cambiada Exitosamente" }) : res.json({ error: "error de conexion" })
    }else {
        const com = req.body.com.com;
        const com2 = req.body.com.com2;
        const pool = await getConnection();
        const result = await pool.request()
            .input("Com", sql.VarChar, `${com}`)
            .input("Com2", sql.VarChar, `${com2}`)
            .query(`UPDATE Configuraciones SET Valor = @Com WHERE Parametro = 'Port_Name1'; UPDATE Configuraciones SET Valor = @Com2 WHERE Parametro = 'Port_Name2'
                UPDATE Configuraciones SET Valor = '1' WHERE Parametro = '2basculas'`)
        const response = result
        console.log(response);
        response.rowsAffected ? res.json({ message: "Trama cambiada Exitosamente" }) : res.json({ error: "error de conexion" })
    }
   
}

async function traerIpDisplay(req, res){
    const pool = await getConnection();
    const result = await pool.request()
        .query(`select Valor from Configuraciones where Parametro = 'display'`)
    const response = result.recordset
    res.json(response)
}



async function cambiarIpDisplay(req, res){
    const display = req.body.display;
    const pool = await getConnection();
    const result = await pool.request()
        .input("display", sql.VarChar, display)
        .query(`UPDATE Configuraciones SET Valor = @display WHERE Parametro = 'display'`)
    const response = result
    response.rowsAffected ? res.json({ message: "Trama cambiada Exitosamente" }) : res.json({ error: "error de conexion" })
}


async function getRecibo(req, res){
    const pool = await getConnection();
    const result = await pool.request()
        .query(`select * from Configuraciones 
        where Parametro = 'Empresa'
        or Parametro = 'Departamento'
        or Parametro = 'Direccion'
        or Parametro = 'Telefono'
        or Parametro = 'Campo1'
        or Parametro = 'Campo2'`)
    const response = result.recordset
    res.json(response)
}

async function createRecibo(req, res){
    const empresa = req.body.empresa;
    const departamento = req.body.departamento;
    const direccion = req.body.direccion;
    const telefono = req.body.telefono;
    const campo1 = req.body.campo1;
    const campo2 = req.body.campo2;
    const pool = await getConnection();
    const result = await pool.request()
        .input("Empresa", sql.VarChar, empresa)
        .input("Departamento", sql.VarChar, departamento)
        .input("Direccion", sql.VarChar, direccion)
        .input("Telefono", sql.VarChar, telefono)
        .input("Campo1", sql.VarChar, campo1)
        .input("Campo2", sql.VarChar, campo2 || '')
        .query(`UPDATE Configuraciones SET Valor = @Empresa WHERE Parametro = 'Empresa';
                UPDATE Configuraciones SET Valor = @Departamento WHERE Parametro = 'Departamento';
                UPDATE Configuraciones SET Valor = @Direccion WHERE Parametro = 'Direccion';
                UPDATE Configuraciones SET Valor = @Telefono WHERE Parametro = 'Telefono';
                UPDATE Configuraciones SET Valor = @Campo1 WHERE Parametro = 'Campo1';
                UPDATE Configuraciones SET Valor = @Campo2 WHERE Parametro = 'Campo2';`)
    if (!result.rowsAffected) {
        res.json({ error: "error de conexion" })
        return null
    }else {
        res.json({ message: "Recibo cambiado" })
    }
}

module.exports  = {
    cambiarTrama,
    traerTrama,
    traerCom,
    traerCom1,
    traerCom2,
    cambiarCom,
    traerIpDisplay,
    cambiarIpDisplay,
    getRecibo,
    createRecibo,
    basculas
}
