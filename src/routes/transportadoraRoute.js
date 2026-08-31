const express = require('express') 
const router = express.Router();
const {traerTransportadora, getTransportadoras, createTransportadoras, updateTransportadora} = require('../controllers/transportadoras.controller.js')

router.get("/getTransportadoras", getTransportadoras)
router.post("/getOneTransportadora", traerTransportadora)
router.post("/createTransportadora", createTransportadoras)
router.put("/updateTransportadora", updateTransportadora)

module.exports = router;
