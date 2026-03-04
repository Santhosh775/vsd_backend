const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder } = require('../controller/orderController');
const { createOrderValidation, updateOrderValidation, getOrderByIdValidation, deleteOrderValidation, handleValidationErrors } = require('../validator/orderValidator');

// Create a new order
router.post('/create', createOrderValidation, handleValidationErrors, createOrder);

// Get all orders
router.get('/list', getAllOrders);

// Get order by ID
router.get('/:id', getOrderByIdValidation, handleValidationErrors, getOrderById);

// Update order
router.put('/:id', updateOrderValidation, handleValidationErrors, updateOrder);

// Delete order
router.delete('/:id', deleteOrderValidation, handleValidationErrors, deleteOrder);

module.exports = router;