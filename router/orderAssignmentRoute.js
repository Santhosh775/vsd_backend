const express = require('express');
const router = express.Router();
const {
    getOrderAssignment,
    updateStage1Assignment,
    updateStage2Assignment,
    getAssignmentOptions
} = require('../controller/orderAssignmentController');

// Get order assignment by order ID
router.get('/:orderId', getOrderAssignment);

// Update stage 1 assignment
router.put('/:orderId/stage1', updateStage1Assignment);

// Update stage 2 assignment
router.put('/:orderId/stage2', updateStage2Assignment);

// Get all assignment options (farmers, suppliers, etc.)
router.get('/options/all', getAssignmentOptions);

module.exports = router;