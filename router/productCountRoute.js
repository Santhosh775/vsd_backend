const express = require('express');
const router = express.Router();

const {
    getAllProductCounts,
    updateProductCountStatus,
    bulkUpdateProductCountStatus
} = require('../controller/productCountController');

// Get all product counts (with pagination and search)
router.get('/', getAllProductCounts);

// Bulk update product count statuses (must be before :productId to avoid conflict)
router.put('/bulk/status', bulkUpdateProductCountStatus);

// Update single product count status (upsert)
router.put('/:productId', updateProductCountStatus);

module.exports = router;
