const express = require('express') 
const router = express.Router();
const {getDestinos, traerDestino, createDestinos, updateDestino} = require('../controllers/destinos.controller.js')

router.get("/getDestinos", getDestinos)
router.post("/getOneDestino", traerDestino)
router.post("/createDestino", createDestinos)
router.put("/updateDestino", updateDestino)

module.exports = router;