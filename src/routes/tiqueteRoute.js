
const express = require('express') 
const router = express.Router();
const {traerTiquete, updateTiquete} = require('../controllers/tiquete.controller.js')

router.post("/traerTiquete", traerTiquete)
router.post("/updateTiquete", updateTiquete)

module.exports = router;
