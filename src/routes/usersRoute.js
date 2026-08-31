const express = require('express') 
const router = express.Router();
const {getUsers, updateUser, registerUser} = require('../controllers/user.controller.js')

router.get("/getUsers", getUsers)
router.put("/updateUser", updateUser)
router.post("/registerUser", registerUser)



module.exports = router;
