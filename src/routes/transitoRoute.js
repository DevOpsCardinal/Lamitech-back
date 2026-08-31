const express = require('express') 
const router = express.Router();
const {transito, getAllTransito, deleteTransitoById, ultimoTrasnsito, ultimoTransitoByPlaca} = require('../controllers/transito.controller')

router.post("/guardarTransito", transito)
router.post("/borrarTransito", deleteTransitoById)
router.get("/geAllTransito", getAllTransito)
router.post("/ultimoTransito", ultimoTrasnsito)
router.post("/ultimoTransitoByPlaca", ultimoTransitoByPlaca)





module.exports = router;
