const express = require('express') 
const router = express.Router();
const {getTrailer, getTrailer2, get100Trailers, getTrailerByDate} = require('../controllers/trailers.controller')

router.post("/getTrailer", getTrailer)
router.post("/getTrailer2", getTrailer2)
router.get("/get100Trailers", get100Trailers)

router.post("/getTrailersfechaApi", getTrailerByDate)






module.exports = router;
