const express = require('express');
const router = express.Router();

const {
    createOrUpdatePermissions,
    getPermissionsByAdminId,
    getAllPermissions,
    deletePermissions
} = require('../controller/rolesPermissionController');

router.post('/:aid', createOrUpdatePermissions);
router.put('/:aid', createOrUpdatePermissions);
router.get('/:aid', getPermissionsByAdminId);
router.get('/', getAllPermissions);
router.delete('/:aid', deletePermissions);

module.exports = router;
