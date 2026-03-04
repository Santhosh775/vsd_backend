const express = require('express');
const router = express.Router();
const preOrderController = require('../controller/preOrderController');
const { validatePreOrder, validatePreOrderStatus, validateOrderId } = require('../validator/preOrderValidator');
const { validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Create or update pre-order
router.post('/create', validatePreOrder, validate, preOrderController.createOrUpdatePreOrder);

// Get all pre-orders
router.get('/', preOrderController.getAllPreOrders);

// Get pre-order by order ID
router.get('/:order_id', validateOrderId, validate, preOrderController.getPreOrderByOrderId);

// Update pre-order status
router.patch('/:order_id/status', validatePreOrderStatus, validate, preOrderController.updatePreOrderStatus);

// Delete pre-order
router.delete('/:order_id', validateOrderId, validate, preOrderController.deletePreOrder);

module.exports = router;
