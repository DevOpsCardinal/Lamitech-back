const express = require('express') 
const router = express.Router();
const {getOrigenes, createOrigenes, traerOrigen, updateOrigen} = require('../controllers/origenes.controller.js')

router.get("/getOrigenes", getOrigenes)
router.post("/getOneOrigen", traerOrigen)
router.post("/createOrigen", createOrigenes)
router.put("/updateOrigen", updateOrigen)

module.exports = router;
