const express = require('express');
const router = express.Router();
const labourController = require('../controller/labourController');
const { validateLabour, validateLabourUpdate, validateExcessPay, validateExcessPayUpdate } = require('../validator/labourValidator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadLabour } = require('../middleware/upload');

// Create a new labour (Admin only)
router.post('/create', 
    authMiddleware, 
    uploadLabour.single('profile_image'),
    validateLabour,
    labourController.createLabour
);

// Get all labours (Admin only)
router.get('/list', 
    authMiddleware, 
    labourController.getAllLabours
);

// Get labour by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    labourController.getLabourById
);

// Update labour by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    uploadLabour.single('profile_image'),
    validateLabourUpdate,
    labourController.updateLabour
);

// Delete labour by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    labourController.deleteLabour
);

// Search labours (Admin only)
router.get('/search/query', 
    authMiddleware, 
    labourController.searchLabours
);

// Get labour summary statistics (Admin only)
router.get('/stats/summary', 
    authMiddleware, 
    labourController.getLabourStats
);

// Labour Excess Pay Routes

// Create excess pay record
router.post('/excess-pay/create',
    authMiddleware,
    validateExcessPay,
    labourController.createExcessPay
);

// Get all excess pay records
router.get('/excess-pay/list',
    authMiddleware,
    labourController.getAllExcessPay
);

// Get excess pay record by ID
router.get('/excess-pay/:id',
    authMiddleware,
    labourController.getExcessPayById
);

// Update excess pay record
router.put('/excess-pay/:id',
    authMiddleware,
    validateExcessPayUpdate,
    labourController.updateExcessPay
);

// Delete excess pay record
router.delete('/excess-pay/:id',
    authMiddleware,
    labourController.deleteExcessPay
);

module.exports = router;