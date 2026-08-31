const express = require('express') 
const router = express.Router();
const {traerMateriaPrima, updateMateriaPrima, getMateriasPrimas, createMateriaPrima} = require('../controllers/materiaPrima.controller.js')

router.get("/getMateriaPrimas", getMateriasPrimas)
router.post("/getOneMateriaPrima", traerMateriaPrima)
router.post("/createMateriaPrima", createMateriaPrima)
router.put("/updateMateriaPrima", updateMateriaPrima)

module.exports = router;
