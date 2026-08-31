const express = require('express') 
const router = express.Router();
const {createDespacho, ultimoDespacho, getDespachos, getDespachosByDate, ultimaSalida, getDespachosByPlaca} = require('../controllers/despachos.controller.js')

router.post("/guardarDespacho", createDespacho)
router.get("/ultimoDespacho", ultimoDespacho)
router.get("/100despachos", getDespachos)
router.post("/despachosByDate", getDespachosByDate)

router.post("/updateUltimaSalida", ultimaSalida)
router.post("/getDespachosByPlaca", getDespachosByPlaca)









module.exports = router;
