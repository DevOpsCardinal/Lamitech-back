const express = require('express') 
const {getVehiculos} = require('../controllers/vehiculo.controller.js')
const router = express.Router();

router.get("/getAllVehiculos", getVehiculos)





module.exports = router;
