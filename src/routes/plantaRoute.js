const express = require('express') 
const router = express.Router();
const {traerPlanta, createPlantas, getPlantas, updatePlanta} = require('../controllers/plantas.controller.js')

router.get("/getPlantas", getPlantas)
router.post("/getOnePlanta", traerPlanta)
router.post("/createPlantas", createPlantas)
router.put("/updatePlanta", updatePlanta)



module.exports = router;
