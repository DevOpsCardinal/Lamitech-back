const express = require('express') 
const {traerTrama, getRecibo, basculas, cambiarCom, cambiarTrama, createRecibo} = require('../controllers/configuraciones.controller.js')
const router = express.Router();

router.get("/trama", traerTrama)
router.get("/recibo", getRecibo)
router.get("/basculas", basculas)
router.post("/cambiarComs", cambiarCom)
router.post("/cambiarTrama", cambiarTrama)
router.post("/recibo", createRecibo)






module.exports = router;
