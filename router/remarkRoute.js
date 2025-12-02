const express = require('express');
const router = express.Router();
const remarkController = require('../controller/remarkController');
const { 
    validateRemark, 
    validateRemarkUpdate 
} = require('../validator/driverValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a new remark (Admin only)
router.post('/create', 
    authMiddleware, 
    validateRemark,
    remarkController.createRemark
);

// Get all remarks (Admin only)
router.get('/list', 
    authMiddleware, 
    remarkController.getAllRemarks
);

// Search remarks (Admin only)
router.get('/search/query', 
    authMiddleware, 
    remarkController.searchRemarks
);

// Get remarks count by driver (Admin only)
router.get('/count-by-driver', 
    authMiddleware, 
    remarkController.getRemarksCountByDriver
);

// Get remarks by date range (Admin only)
router.get('/date-range', 
    authMiddleware, 
    remarkController.getRemarksByDateRange
);

// Get remarks by driver ID (Admin only)
router.get('/driver/:driver_id', 
    authMiddleware, 
    remarkController.getRemarksByDriverId
);

// Get remark by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    remarkController.getRemarkById
);

// Update remark by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    validateRemarkUpdate,
    remarkController.updateRemark
);

// Delete remark by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    remarkController.deleteRemark
);

module.exports = router;