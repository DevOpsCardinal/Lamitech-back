const {getConnection, sql} = require('../database/connection')


async function traerTiquete(req, res){
    try {
        console.log(req.body);
        const busqueda = req.body.busqueda
        const valor = req.body.valor
        const query = `SELECT * FROM ${busqueda == 'Despachos' ? '[Despachos]' : '[Ingresos]'} WHERE No_Tiquete = @Valor`
        const pool = await getConnection();
        const result = await pool.request()
            .input("Valor", sql.VarChar, valor)
            .query(query)
        const response = result.recordset

        res.json(response)

    } catch (error) {
        res.send({ error: 'No se encontró el registro' })
    }
}


async function updateTiquete(req, res) {
    console.log(req.body);
    const form = req.body.formValue;
    const estado = req.body.busqueda;
    const pool = await getConnection();
    const query = `
    UPDATE ${estado === 'Despachos' ? "Despachos" : "Ingresos"}
    SET 
        [Placa] = @Placa, 
        [Conductor] = @Conductor, 
        [Planta] = @Planta, 
        [Transportadora] = @Transportadora,
        [Fecha_Peso_Vacio] = @FechaPesoVacio, 
        [Hora_Peso_Vacio] = @HoraPesoVacio, 
        [Fecha_Peso_lleno] = @FechaPesoLLeno,
        [Hora_Peso_lleno] = @HoraPesoLLeno, 
        ${estado === 'Despachos' ? "[Destino] = @Destino," : "[Origen] = @Destino,"}
        [Cedula] = @Cedula, 
        ${estado === 'Despachos' ? "[Producto] = @ProductoMateria," : "[Materia_Prima] = @ProductoMateria,"}
        ${estado === 'Despachos' ? "[Cliente] = @Cliente," : "[Proveedor] = @Cliente,"} 
        [Bruto] = @Bruto, 
        [Tara] = @Tara, 
        [Neto] = @Neto,
        [Operario] = @Operario, 
        [Observaciones] = @Observaciones, 
        [Nick_Operario] = @NickOperario
    WHERE No_Tiquete = @NoTiquete
`;
console.log(query);

    try {
        const result = await pool.request()
            .input("Placa", sql.VarChar, form.placa)
            .input("Conductor", sql.VarChar, form.conductor)
            .input("Planta", sql.VarChar, form.planta)
            .input("Transportadora", sql.VarChar, form.transportadora)
            .input("FechaPesoVacio", sql.VarChar, estado == 'Despachos' ? form.fechaIngreso : form.fechaSalida)
            .input("HoraPesoVacio", sql.VarChar, estado == 'Despachos' ? form.horaIngreso : form.horaSalida)
            .input("FechaPesoLLeno", sql.VarChar, estado == 'Despachos' ? form.fechaSalida : form.fechaIngreso)
            .input("HoraPesoLLeno", sql.VarChar, estado == 'Despachos' ? form.horaSalida : form.horaIngreso)
            .input("Destino", sql.VarChar, form.origenDestino)
            .input("Cedula", sql.Int, parseInt(form.cedula))
            .input("ProductoMateria", sql.VarChar, form.producto)
            .input("Cliente", sql.VarChar, form.cliente)
            .input("Bruto", sql.Int, parseInt(form.bruto))
            .input("Tara", sql.Int, parseInt(form.tara))
            .input("Neto", sql.Int, parseInt(form.neto))
            .input("NoTiquete", sql.Int, parseInt(form.NoTiquete))
            .input("Operario", sql.VarChar, form.operario)
            .input("Observaciones", sql.VarChar, form.observaciones)
            .input("NickOperario", sql.VarChar, form.operario)
            .query(query);
        console.log("updateTiquete: ", result);
        res.json(result);
    } catch (error) {
        console.error("Error updating tiquete: ", error);
        res.status(500).send("Error updating tiquete");
    }
}


module.exports = {
    traerTiquete,
    updateTiquete
}