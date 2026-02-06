const express = require('express');
const router = express.Router();
const {
    getFlowerOrderAssignment,
    getDriverFlowerOrdersFromStage1AndStage3,
    updateStage1Assignment,
    updateStage2Assignment,
    updateStage3Assignment,
    updateStage4Assignment
} = require('../controller/flowerOrderController');

// Get flower orders for a driver from stage1_summary_data and stage3_summary_data – must be before /:orderId
router.get('/driver/:driverId/stage1-and-stage3', getDriverFlowerOrdersFromStage1AndStage3);

// Get flower order assignment by order ID (only for FLOWER ORDER type)
router.get('/:orderId', getFlowerOrderAssignment);

// Update Stage 1 - Product Collection
router.put('/:orderId/stage1', updateStage1Assignment);

// Update Stage 2 - Packaging
router.put('/:orderId/stage2', updateStage2Assignment);

// Update Stage 3 - Airport Delivery
router.put('/:orderId/stage3', updateStage3Assignment);

// Update Stage 4 - Review
router.put('/:orderId/stage4', updateStage4Assignment);

module.exports = router;
