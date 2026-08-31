const express = require('express') 
const router = express.Router();
const {traerCliente, getClientes, createCliente, updateCliente} = require('../controllers/clientes.controller.js')

router.get("/getClientes", getClientes)
router.post("/getOneCliente", traerCliente)
router.post("/createCliente", createCliente)
router.put("/updateCliente", updateCliente)



module.exports = router;
