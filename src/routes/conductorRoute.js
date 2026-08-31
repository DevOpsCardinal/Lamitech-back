const express = require('express') 
const router = express.Router();
const {getConductores, createConductor, traerConductor, updateConductor} = require('../controllers/conductor.controller.js')

router.get("/getConductores", getConductores)
router.post("/getOneConductor", traerConductor)
router.post("/createConductor", createConductor)
router.put("/updateConductor", updateConductor)

module.exports = router;
