const express = require('express');
const router = express.Router();
const vendorController = require('../controller/vendorController');
const { validateVendor, validateVendorUpdate } = require('../validator/vendorValidator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadVendor } = require('../middleware/upload');

// Vendor routes
router.post('/create', authMiddleware, uploadVendor.single('profile_image'), validateVendor, vendorController.createVendor);
router.get('/list', vendorController.getAllVendors);
router.get('/:id', authMiddleware, vendorController.getVendor);
router.put('/:id', authMiddleware, uploadVendor.single('profile_image'), validateVendorUpdate, vendorController.updateVendor);
router.delete('/:id', authMiddleware, vendorController.deleteVendor);

module.exports = router;