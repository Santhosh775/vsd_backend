const express = require('express');
const router = express.Router();
const remarkController = require('../controller/remarkController');

// Create a new remark (Admin only)
router.post('/create', 
    remarkController.createRemark
);

// Get all remarks (Admin only)
router.get('/list', 
    remarkController.getAllRemarks
);

// Search remarks (Admin only)
router.get('/search/query', 
    remarkController.searchRemarks
);

// Get remarks count by driver (Admin only)
router.get('/count-by-driver',  
    remarkController.getRemarksCountByDriver
);

// Get remarks by date range (Admin only)
router.get('/date-range',  
    remarkController.getRemarksByDateRange
);

// Get remarks by driver ID (Admin only)
router.get('/driver/:driver_id',  
    remarkController.getRemarksByDriverId
);

// Get remark by ID (Admin only)
router.get('/:id',  
    remarkController.getRemarkById
);

// Update remark by ID (Admin only)
router.put('/:id',  
    remarkController.updateRemark
);

// Delete remark by ID (Admin only)
router.delete('/:id',  
    remarkController.deleteRemark
);

module.exports = router;