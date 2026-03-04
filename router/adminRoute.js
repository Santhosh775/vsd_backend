const express = require('express');
const router = express.Router();

const {
    registerAdmin, 
    loginAdmin, 
    getAllAdmins, 
    getAdminById, 
    updateAdmin, 
    deleteAdmin,
    updateRolesPermissions,
    getRolesPermissions
} = require('../controller/adminController');
const {registerValidation, loginValidation, validate} = require('../validator/adminValidator');
// const {loginLimiter} = require('../middleware/rateLimit');


router.post('/register', registerValidation, validate, registerAdmin);
router.post('/login', loginValidation, validate, loginAdmin);
router.get('/all', getAllAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);
router.put('/:id/permissions', updateRolesPermissions);
router.get('/:id/permissions', getRolesPermissions);

module.exports = router;