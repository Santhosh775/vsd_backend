const express = require('express');
const router = express.Router();
const excessKMController = require('../controller/excessKmController');
const { 
    validateExcessKM, 
    validateExcessKMUpdate 
} = require('../validator/driverValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a new excess KM record (Admin only)
router.post('/create', 
    authMiddleware, 
    validateExcessKM,
    excessKMController.createExcessKM
);

// Get all excess KM records (Admin only)
router.get('/list', 
    authMiddleware, 
    excessKMController.getAllExcessKMs
);

// Get excess KM statistics (Admin only)
router.get('/stats', 
    authMiddleware, 
    excessKMController.getExcessKMStats
);

// Get excess KM records by date range (Admin only)
router.get('/date-range', 
    authMiddleware, 
    excessKMController.getExcessKMsByDateRange
);

// Get excess KM records by driver ID (Admin only)
router.get('/driver/:driver_id', 
    authMiddleware, 
    excessKMController.getExcessKMsByDriverId
);

// Get excess KM record by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    excessKMController.getExcessKMById
);

// Update excess KM record by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    validateExcessKMUpdate,
    excessKMController.updateExcessKM
);

// Delete excess KM record by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    excessKMController.deleteExcessKM
);

module.exports = router;