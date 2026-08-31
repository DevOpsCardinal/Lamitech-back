const express = require('express') 
const router = express.Router();
const {traerProveedor, getALlProveedor, createProveedor, updateProveedor} = require('../controllers/proveedor.controller.js')

router.get("/getProveedores", getALlProveedor)
router.post("/getOneProveedor", traerProveedor)
router.post("/createProveedor", createProveedor)
router.put("/updateProveedor", updateProveedor)

module.exports = router;
