
const express = require('express')
const config = require('./config')
const routes = require('./routes/routes.js')
const cors = require('cors')
const {traerCom1, traerCom2} = require('./controllers/configuraciones.controller.js')
const { Server } = require('socket.io');
const http = require('http')

let peso
let port1
let peso2
let port1_2

const app = express()


// settings
app.set('port', config.port)
http.listen

//midelwars
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(routes)
app.use('/uploads', express.static('uploads'));
var server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
})
const io = new Server(server, {
    cors: { origin: '*', credentials: false },
});


let com
let com2
const getCom = async () => {
    const comResponse = await traerCom1()
    console.log(comResponse);
    const com1 = "COM" + comResponse[0].Valor
    com = "COM" + comResponse[0].Valor

    console.log(com1)

    return com1
}

const getCom2 = async () => {
  const comResponse = await traerCom2()
  console.log(comResponse);
  const com1 = "COM" + comResponse[0].Valor
  com2 = "COM" + comResponse[0].Valor

  console.log(com1)

  return com2
}





let delimit = '\r\n'


const comunicador = async (com, delimiter) => {
    const coms = await getCom()
    const coms2 = await getCom2()


    console.log("coms", coms, coms2)

    const { SerialPort } = require('serialport')
    const { ReadlineParser } = require('@serialport/parser-readline')
    try {
        

        function indicador1() {
            
            try {
                port1_2 = new SerialPort({ path: `\\\\.\\${coms2}`, baudRate: 9600 })
                port1_2.on('error', function (err) {
                    console.log("error ----> " + err);
                })
            } catch (error) {
                console.log("ERROR SERIAL")
            }
  
            const parser = port1_2.pipe(new ReadlineParser({ delimiter: '\r\n' }))
            parser.on('data', function (data) {
                peso = data.toString()
             
                
            })

            const closePort = () => {
                if (port1_2.isOpen) {
                    port1_2.close((err) => {
                        if (err) {
                            console.log("Error closing port: " + err);
                        } else {
                            console.log("Port closed");
                        }
                    });
                }
            };

            process.on('exit', closePort);
            process.on('SIGINT', closePort);
            process.on('SIGUSR1', closePort);
            process.on('SIGUSR2', closePort);
            process.on('uncaughtException', closePort);
        }


        function indicador2() {
        
            try {
                port1 = new SerialPort({ path: `\\\\.\\${coms}`, baudRate: 9600 })
                port1.on('error', function (err) {
                    console.log("error ----> " + err);
                })
            } catch (error) {
                console.log("ERROR SERIAL")
            }

            const parser = port1.pipe(new ReadlineParser({ delimiter: '\r\n' }))
            parser.on('data', function (data) {
                peso2 = data.toString()
               
            })

            const closePort = () => {
                if (port1.isOpen) {
                    port1.close((err) => {
                        if (err) {
                            console.log("Error closing port: " + err);
                        } else {
                            console.log("Port closed");
                        }
                    });
                }
            };

            process.on('exit', closePort);
            process.on('SIGINT', closePort);
            process.on('SIGUSR1', closePort);
            process.on('SIGUSR2', closePort);
            process.on('uncaughtException', closePort);
        }

        indicador1()
        indicador2()


        }catch (error) {
            console.log("Error: " + error);
            if (port1_2 && port1_2.isOpen) {
                port1_2.close((err) => {
                    if (err) {
                        console.log("Error closing port: " + err);
                    } else {
                        console.log("Port closed due to error");
                    }
                });
            }

            if (port1 && port1.isOpen) {
                port1.close((err) => {
                    if (err) {
                        console.log("Error closing port: " + err);
                    } else {
                        console.log("Port closed due to error");
                    }
                });
            }
     }
}


io.on('connection', async (socket) => {

    comunicador('COM3', delimit)

    socket.on("com", (data) => {
       
        const closePort = () => {
            if (port1_2.isOpen) {
                port1_2.close((err) => {
                    if (err) {
                        console.log("Error closing port: " + err);
                    } else {
                        console.log("Port closed");
                    }
                });
            }
        };

        const closePort2 = () => {
            if (port1.isOpen) {
                port1.close((err) => {
                    if (err) {
                        console.log("Error closing port: " + err);
                    } else {
                        console.log("Port closed");
                    }
                });
            }
        };

        closePort()
        closePort2()
        comunicador(data.message, data.delimit)

    })




    setInterval(() => {
        socket.emit("peso", peso ? peso : peso = "0")
        socket.emit("peso2", peso2 ? peso2 : peso2 = "0")
    }, 1000);




});


module.exports = app;