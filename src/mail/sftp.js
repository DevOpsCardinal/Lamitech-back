let Client = require('ssh2-sftp-client');
const fs = require('fs');

async function createSftp(ruta, name) {
  let sftp = new Client();
  sftp
    .connect({
      port: 22,
      host: 'ftp.mccain.com',
      username: 'MCCAINCOL3PL',
      password: 'kKQk3qJT',
    })
    .then(() => {
      const remoteFilePath = `/colombia3pl/3PLMADRIDCOL_${name}`;

      // Utiliza la función put() para subir el archivo al servidor SFTP
      return sftp.put(fs.createReadStream(`./${ruta}`), remoteFilePath);
    })
    .then(() => {
      console.log('Archivo subido exitosamente al servidor SFTP');
      sftp.end();
    })
    .catch((err) => {
      console.error(err.message);
    });

  sftp.on('error', (err) => {
    console.error('Error:', err);
  });
}

module.exports = {
  createSftp,
};
