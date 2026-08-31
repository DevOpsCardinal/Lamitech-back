const express = require('express')

const authRoutes = require('./authRoute.js')
const configRoutes = require('./configuracionesRoute.js')
const conductoresRoutes = require('./conductorRoute.js')
const plantasRoutes = require('./plantaRoute.js')
const clientesRoutes = require('./clienteRoute.js')
const ProveedoresRoutes = require('./proveedorRoute.js')
const origenesRoutes = require('./origenRoute.js')
const destinosRoutes = require('./destinoRoute.js')
const productosRoutes = require('./productoRoute.js')
const materiasPrimasRoutes = require('./materiaPrimaRoute.js')
const transportadorasRoutes = require('./transportadoraRoute.js')
const transitoRoutes = require('./transitoRoute.js')
const despachoRoutes = require('./despachoRoute.js')
const ingresoRoutes = require('./ingresosRoute.js')
const usersRoutes = require('./usersRoute.js')
const vehiculosRoutes = require('./vehiculosRoute.js')
const archivosRoutes = require('./uploadRoute.js')
const tiquetesRoutes = require('./tiqueteRoute.js')
const trailerRoutes = require('./trailerRoute.js')






const {verifyToken} = require('../token/verifyToken.js')
const router = express.Router();
const baseURL = "api/v5"

router.use(`/${baseURL}/auth`, authRoutes)
router.use(`/${baseURL}/transito`, verifyToken, transitoRoutes)
router.use(`/${baseURL}/despacho`, verifyToken, despachoRoutes)
router.use(`/${baseURL}/ingreso`, verifyToken, ingresoRoutes)
router.use(`/${baseURL}/users`,verifyToken, usersRoutes)
router.use(`/${baseURL}/config`, verifyToken, configRoutes)
router.use(`/${baseURL}/conduc`, verifyToken, conductoresRoutes)
router.use(`/${baseURL}/planta`, verifyToken, plantasRoutes)
router.use(`/${baseURL}/cliente`, verifyToken, clientesRoutes)
router.use(`/${baseURL}/prov`, verifyToken, ProveedoresRoutes)
router.use(`/${baseURL}/origen`, verifyToken, origenesRoutes)
router.use(`/${baseURL}/destino`, verifyToken, destinosRoutes)
router.use(`/${baseURL}/prod`, verifyToken, productosRoutes)
router.use(`/${baseURL}/materiaPrima`, verifyToken, materiasPrimasRoutes)
router.use(`/${baseURL}/transport`, verifyToken, transportadorasRoutes)
router.use(`/${baseURL}/vehiculo`, verifyToken, vehiculosRoutes)
router.use(`/${baseURL}/archivos`, verifyToken, archivosRoutes)
router.use(`/${baseURL}/tiquete`, verifyToken, tiquetesRoutes)
router.use(`/${baseURL}/trailer`, verifyToken, trailerRoutes)






module.exports = router;