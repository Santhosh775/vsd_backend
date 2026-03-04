const express = require('express');
const router = express.Router();
const advancePayController = require('../controller/advancePayController');
const { 
    validateAdvancePay, 
    validateAdvancePayUpdate 
} = require('../validator/driverValidator');

// Create a new advance payment
router.post('/create', 
    validateAdvancePay,
    advancePayController.createAdvancePay
);

// Get all advance payments
router.get('/list', 
    advancePayController.getAllAdvancePays
);

// Get advance payment statistics
router.get('/stats', 
    advancePayController.getAdvancePayStats
);

// Get advance payments by date range
router.get('/date-range', 
    advancePayController.getAdvancePaysByDateRange
);

// Get advance payments by driver ID
router.get('/driver/:driver_id', 
    advancePayController.getAdvancePaysByDriverId
);

// Get advance payment by ID
router.get('/:id', 
    advancePayController.getAdvancePayById
);

// Update advance payment by ID
router.put('/:id', 
    validateAdvancePayUpdate,
    advancePayController.updateAdvancePay
);

// Delete advance payment by ID
router.delete('/:id', 
    advancePayController.deleteAdvancePay
);

module.exports = router;