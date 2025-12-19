const { body, param } = require('express-validator');

exports.validatePreOrder = [
    body('order_id')
        .notEmpty()
        .withMessage('Order ID is required'),

    body('collection_type')
        .notEmpty()
        .withMessage('Collection type is required')
        .isIn(['Box', 'Bag'])
        .withMessage('Collection type must be Box or Bag'),

    body('product_assignments')
        .optional()
        .isArray()
        .withMessage('Product assignments must be an array'),

    body('delivery_routes')
        .optional()
        .isArray()
        .withMessage('Delivery routes must be an array'),

    body('summary_data')
        .optional()
        .isObject()
        .withMessage('Summary data must be an object')
];

exports.validatePreOrderStatus = [
    param('order_id')
        .notEmpty()
        .withMessage('Order ID is required'),

    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['pending', 'completed', 'cancelled'])
        .withMessage('Status must be pending, completed, or cancelled')
];

exports.validateOrderId = [
    param('order_id')
        .notEmpty()
        .withMessage('Order ID is required')
];
