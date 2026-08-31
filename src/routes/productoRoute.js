const express = require('express') 
const router = express.Router();
const {traerProducto, getAllProducts, createProducto, updateProducto} = require('../controllers/productos.controller.js')

router.get("/getProductos", getAllProducts)
router.post("/getOneProducto", traerProducto)
router.post("/createProducto", createProducto)
router.put("/updateProducto", updateProducto)

module.exports = router;
