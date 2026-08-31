const { getConnection, sql } = require('../database/connection');

async function getTrailer(req, res) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input('Trailer', sql.VarChar, req.body.trailer)
    .query(
      'SELECT TOP (1) * From Trailers where Trailer = @Trailer order by Fecha_Entrada desc'
    );
  const response = result.recordset;
  res.json(response);
}

async function get100Trailers(req, res){
  const pool = await getConnection();
  const result = await pool.request().query('SELECT TOP (100) * FROM Trailers order by Fecha_Entrada desc')
  const response = result.recordset
  res.json(response)
}

async function getTrailer2(req, res) {
  const { trailer, placa, proceso, fecha } = req.body;
  console.log('body: ', trailer, placa, proceso, fecha);

  const partes = fecha.split('T');

  const pool = await getConnection();
  const result = await pool
    .request()
    .input('Trailer', sql.VarChar, trailer)
    .input('placa', sql.VarChar, placa)
    .input('fecha', sql.VarChar, fecha)

    .query(
      `SELECT TOP (1) * From Trailers where Trailer = @Trailer and ${
        proceso == 'Recoger_Trailer' ? 'Placa_Salida' : 'Placa_Entrada'
      } = @placa and  ${
        proceso == 'Recoger_Trailer' ? 'Fecha_Salida' : 'Fecha_Entrada'
      } = @fecha order by Fecha_Entrada desc`
    );
  const response = result.recordset;
  res.json(response);
}

const getTrailerByDate = async  (req, res) => {
  const fechaInicial = req.body.fechaInicial
      const fechaFinal = req.body.fechaFinal
      const valor = req.body.valor
      const query = `select * from Trailers where Fecha_Entrada between @fechaInicial and @fechaFinal order by Fecha_Entrada desc `
      const pool = await getConnection();
      const result = await pool.request()
         .input("fechaInicial", sql.VarChar, fechaInicial)
         .input("fechaFinal", sql.VarChar, fechaFinal)
         .input("Valor", sql.VarChar, valor)
         .query(query)
         const response = result.recordset
         console.log(response)
         res.json(response)
}

module.exports = {
  getTrailer,
  getTrailer2,
  get100Trailers,
  getTrailerByDate
};
