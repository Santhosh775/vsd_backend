const express = require('express');
const router = express.Router();
const {
    getOrderAssignment,
    getOrdersByDriverId,
    updateStage1Assignment,
    updateStage2Assignment,
    updateStage3Assignment,
    updateStage4Assignment,
    saveItemAssignmentUpdate,
    getItemAssignments,
    getAssignmentOptions,
    getAllStock,
    getAvailableStockByProduct,
    getProductStock
} = require('../controller/orderAssignmentController');

// Get orders assigned to a driver (for driver app) – must be before /:orderId
router.get('/driver/:driverId', getOrdersByDriverId);

// Get order assignment by order ID
router.get('/:orderId', getOrderAssignment);

// Update stage 1 assignment
router.put('/:orderId/stage1', updateStage1Assignment);

// Update stage 2 assignment
router.put('/:orderId/stage2', updateStage2Assignment);

// Update stage 3 assignment (airport driver)
router.put('/:orderId/stage3', updateStage3Assignment); 

// Update stage 4 assignment (review)
router.put('/:orderId/stage4', updateStage4Assignment); 

// Save item assignment by order item ID
router.post('/:orderId/item-assignment/:oiid', saveItemAssignmentUpdate);

// Get item assignments
router.get('/:orderId/item-assignments', getItemAssignments);

// Get all assignment options (farmers, suppliers, etc.)
router.get('/options/all', getAssignmentOptions);

// Get all stock data
router.get('/stock/all', getAllStock);

// Get available stock grouped by product
router.get('/stock/available/all', getAvailableStockByProduct);

// Get available stock for specific product
router.get('/stock/product/:productName', getProductStock);

module.exports = router;