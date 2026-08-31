const express = require('express') 
const {loginUser, getLimitToken} = require('../controllers/auth.js')
const router = express.Router();

router.post("/login", loginUser)
router.get("/token", getLimitToken)




module.exports = router;
