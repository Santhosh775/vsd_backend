const express = require('express');
const router = express.Router();
const supplierController = require('../controller/supplierController');
const { validateSupplier, validateSupplierUpdate } = require('../validator/supplierValidator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadSupplier } = require('../middleware/upload');

// Create a new supplier (Admin only)
router.post('/create', 
    authMiddleware, 
    uploadSupplier.single('profile_image'),
    validateSupplier,
    supplierController.createSupplier
);

// Get all suppliers (Admin only)
router.get('/list', 
    authMiddleware, 
    supplierController.getAllSuppliers
);

// Get supplier by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    supplierController.getSupplierById
);

// Update supplier by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    uploadSupplier.single('profile_image'),
    validateSupplierUpdate,
    supplierController.updateSupplier
);

// Delete supplier by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    supplierController.deleteSupplier
);

// Search suppliers (Admin only)
router.get('/search', 
    authMiddleware, 
    supplierController.searchSuppliers
);

module.exports = router;