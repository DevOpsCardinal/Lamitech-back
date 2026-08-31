const express = require('express') 
const router = express.Router();
const {createIngreso, ultimoIngreso, getMaterias, getMateriasByDate, getIngresosByPlaca} = require('../controllers/ingresos.controller.js')

router.post("/guardarIngreso", createIngreso)
router.get("/ultimoIngreso", ultimoIngreso)
router.get("/100ingresos", getMaterias)
router.post("/ingresosByDate", getMateriasByDate)
router.post("/getIngresosByPlaca", getIngresosByPlaca)






module.exports = router;