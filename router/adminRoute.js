const express = require('express');
const router = express.Router();

const {registerAdmin, loginAdmin} = require('../controller/adminController');
const {registerValidation, loginValidation, validate} = require('../validator/adminValidator');
const {loginLimiter} = require('../middleware/rateLimit');


router.post('/register', registerValidation, validate, registerAdmin);
router.post('/login', loginLimiter, loginValidation, validate, loginAdmin);

module.exports = router;