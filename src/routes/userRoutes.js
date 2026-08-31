import { Router } from "express";
import verifyToken from "../token/verifyToken";

import { cambiarTrama, traerTrama, traerCom, cambiarCom, traerIpDisplay, cambiarIpDisplay, getRecibo, createRecibo } from "../controllers/configuraciones.controller";
import { getUser, loginUser, registerUser, updateUser } from "../controllers/user.controller";
import { getVehiculos, createVehiculo, treerVehiculo, updateVehiculo } from "../controllers/vehiculo.controller";
import { getConductor, createConductor, traerConductor, updateConductor } from "../controllers/conductor.controller";
import { getMateriasPrimas, createMateriaPrima, updateMateriaPrima, traerMateriaPrima } from "../controllers/materiaPrima.controller";
import { getPlantas, createPlantas, updatePlanta, traerPlanta } from "../controllers/plantas.controller";
import { createCliente, getClientes, traerCliente, updateCliente } from "../controllers/clientes.controller";
import { getTransportadoras, createTransportadoras, traerTransportadora } from "../controllers/transportadoras.controller";
import { createCiv, getCiv } from "../controllers/civ.controller";
import { getEntradaTransito, CreateEntradaTransito, deleteTransitoById, countTransitoEnv, countTransito, getEntradaTransito2 } from "../controllers/transito.controller";
import { getDespachos, getDespachosByDate, countDespachos, createDespacho } from "../controllers/despachos.controller";
import { getMaterias, getMateriasByDate, countMaterias, createEntradaMateria } from "../controllers/entradaMatarias.controller";
import { createProducto, getProductos, traerProducto, updateProducto } from "../controllers/productos.controller";
import { createOrigenes, traerOrigen, updateOrigen } from "../controllers/origenes.controller";
import { createDestinos, getDestinos, traerDestino, updateDestino } from "../controllers/destinos.controller";
import { createProveedor, updateProveedor, traerProveedor } from "../controllers/proveedor.controller";
import { updateTransportadora } from "../controllers/transportadoras.controller";
import { registrarTiquete, traerTiquete, updateTiquete } from "../controllers/tiquete.controller";



const multer = require('multer');

const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directorio donde se guardará el archivo
    },
    filename: function (req, file, cb) {
        const newFilename = `logo${path.extname(file.originalname)}`;
        cb(null, newFilename); // Nombre de archivo personalizado
    }
});
const upload = multer({ storage: storage });

const router = Router()

router.get('/api/usuarios', verifyToken, getUser)
router.get('/api/vehiculos', verifyToken, getVehiculos)
router.get('/api/conductores', verifyToken, getConductor)
router.get('/api/materiaPrima', verifyToken, getMateriasPrimas)
router.get('/api/plantas', verifyToken, getPlantas)
router.get('/api/clientes', verifyToken, getClientes)
router.get('/api/transportadoras', verifyToken, getTransportadoras)
router.get('/api/civ', verifyToken, getCiv)
/*router.get('/api/entradaTransito', verifyToken, getEntradaTransito)*/
// router.get('/api/entradaTransito', verifyToken, getTransitoAndRegistrados)
router.get('/api/entradaTransito', verifyToken, getEntradaTransito)
router.get('/api/conteoDespachos', verifyToken, countDespachos)
router.get('/api/conteoEntradaMaterias', verifyToken, countMaterias)
router.get('/api/despachos', verifyToken, getDespachos)
router.get('/api/materias', verifyToken, getMaterias)
router.get('/api/trama', verifyToken, traerTrama)
router.get('/api/com', verifyToken, traerCom)
router.get('/api/productos', verifyToken, getProductos)
router.get('/api/display', verifyToken, traerIpDisplay)
router.get('/api/recibo', verifyToken, getRecibo)
router.get('/api/conteoTransito', verifyToken, countTransito)
router.get('/api/getDestinos', verifyToken, getDestinos)
router.get('/api/getEntradaTransito2', verifyToken, getEntradaTransito2)

















router.post('/api/despachos', verifyToken, createDespacho)
router.post('/api/login', loginUser)
router.post('/api/entradaTransito', verifyToken, CreateEntradaTransito)
router.post('/api/entradaMaterias', verifyToken, createEntradaMateria)
router.post('/api/despachosByDate', verifyToken, getDespachosByDate)
router.post('/api/materiasByDate', verifyToken, getMateriasByDate)
router.post('/api/cambiarTrama', verifyToken, cambiarTrama)
router.post('/api/cambiarCom', verifyToken, cambiarCom)
router.post('/api/cambiarCom', verifyToken, cambiarCom)
router.post('/api/conductores', verifyToken, createConductor)
router.post('/api/transportadoras', verifyToken, createTransportadoras)
router.post('/api/clientes', verifyToken, createCliente)
router.post('/api/productos', verifyToken, createProducto)
router.post('/api/plantas', verifyToken, createPlantas)
router.post('/api/origenes', verifyToken, createOrigenes)
router.post('/api/destinos', verifyToken, createDestinos)
router.post('/api/civ', verifyToken, createCiv)
router.post('/api/vehiculos', verifyToken, createVehiculo)
router.post('/api/materiaPrima', verifyToken, createMateriaPrima)
router.post('/api/display', verifyToken, cambiarIpDisplay)
router.post('/api/recibo', verifyToken, createRecibo)
router.post('/api/registrarUsuario', verifyToken, registerUser)
router.post('/api/buscarConductor', verifyToken, traerConductor)
router.post('/api/buscarCliente', verifyToken, traerCliente)

router.post('/api/updateConductor', verifyToken, updateConductor)
router.post('/api/updateCliente', verifyToken, updateCliente)
router.post('/api/buscarTransportadora', verifyToken, traerTransportadora)
router.post('/api/buscarTiquete', verifyToken, traerTiquete)
router.post('/api/registrarTiquete', verifyToken, registrarTiquete)
router.post('/api/updateTiquete', verifyToken, updateTiquete)






router.post('/api/updateTransportadora', verifyToken, updateTransportadora)
router.post('/api/updateProveedor', verifyToken, updateProveedor)
router.post('/api/buscarProveedor', verifyToken, traerProveedor)

router.post('/api/updateProducto', verifyToken, updateProducto)
router.post('/api/buscarProducto', verifyToken, traerProducto)

// router.post('/api/buscarMateriaPrima', verifyToken, traerMateriaPrima)
router.post('/api/updateMateriaPrima', verifyToken, updateMateriaPrima)
router.post('/api/buscarMateriaPrima', verifyToken, traerMateriaPrima)

router.post('/api/updatePlanta', verifyToken, updatePlanta)
router.post('/api/buscarPlanta', verifyToken, traerPlanta)

router.post('/api/updateOrigen', verifyToken, updateOrigen)
router.post('/api/buscarOrigen', verifyToken, traerOrigen)

router.post('/api/updateDestino', verifyToken, updateDestino)
router.post('/api/buscarDestino', verifyToken, traerDestino)

router.post('/api/proveedores', verifyToken, createProveedor)
router.post('/api/buscarVehiculo', verifyToken, treerVehiculo)
router.post('/api/updateVehiculo', verifyToken, updateVehiculo)








router.get('/api/contarTransito', verifyToken, countTransitoEnv)
// router.get('/api/entradaTransito', verifyToken, '')





router.put('/api/usuarios/:id', verifyToken, updateUser)





router.post('/api/upload', verifyToken, upload.single('archivo'), function (req, res) {
    console.log('Archivo recibido:', req.file);
    res.send({ message: 'Archivo subido correctamente' });
});














router.delete('/api/entradaTransito/:placa', verifyToken, deleteTransitoById)




export default router