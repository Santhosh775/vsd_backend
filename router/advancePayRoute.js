const express = require('express');
const router = express.Router();
const advancePayController = require('../controller/advancePayController');
const { 
    validateAdvancePay, 
    validateAdvancePayUpdate 
} = require('../validator/driverValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a new advance payment (Admin only)
router.post('/create', 
    authMiddleware, 
    validateAdvancePay,
    advancePayController.createAdvancePay
);

// Get all advance payments (Admin only)
router.get('/list', 
    authMiddleware, 
    advancePayController.getAllAdvancePays
);

// Get advance payment statistics (Admin only)
router.get('/stats', 
    authMiddleware, 
    advancePayController.getAdvancePayStats
);

// Get advance payments by date range (Admin only)
router.get('/date-range', 
    authMiddleware, 
    advancePayController.getAdvancePaysByDateRange
);

// Get advance payments by driver ID (Admin only)
router.get('/driver/:driver_id', 
    authMiddleware, 
    advancePayController.getAdvancePaysByDriverId
);

// Get advance payment by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    advancePayController.getAdvancePayById
);

// Update advance payment by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    validateAdvancePayUpdate,
    advancePayController.updateAdvancePay
);

// Delete advance payment by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    advancePayController.deleteAdvancePay
);

module.exports = router;