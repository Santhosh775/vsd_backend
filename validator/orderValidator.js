const { body, query, param, validationResult } = require('express-validator');

// Validation rules for creating an order
const createOrderValidation = [
    body('customerName')
        .notEmpty()
        .withMessage('Customer name is required')
        .isLength({ min: 2 })
        .withMessage('Customer name must be at least 2 characters long'),

    body('customerId')
        .notEmpty()
        .withMessage('Customer ID is required')
        .isInt({ min: 1 })
        .withMessage('Customer ID must be a positive integer'),

    body('orderReceivedDate')
        .notEmpty()
        .withMessage('Order received date is required')
        .isISO8601()
        .withMessage('Please provide a valid date in YYYY-MM-DD format'),

    body('packingDate')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Please provide a valid date in YYYY-MM-DD format'),

    body('packingDay')
        .optional({ nullable: true })
        .isString()
        .withMessage('Packing day must be a string'),

    body('orderType')
        .optional({ nullable: true })
        .isIn(['flight', 'local'])
        .withMessage('Order type must be flight or local'),

    body('detailsComment')
        .optional({ nullable: true })
        .isString()
        .withMessage('Details/Comment must be a string'),

    body('products')
        .optional({ nullable: true })
        .isArray({ min: 1 })
        .withMessage('At least one product is required'),

    body('products.*.productId')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Product ID must be a positive integer'),

    body('products.*.numBoxes')
        .optional({ nullable: true })
        .isString()
        .withMessage('Number of boxes must be a non-negative string'),

    body('products.*.packingType')
        .optional({ nullable: true })
        .isString()
        .withMessage('Packing type must be a string'),

    body('products.*.netWeight')
        .optional({ nullable: true })
        .isString()
        .withMessage('Net weight must be a string'),

    body('products.*.grossWeight')
        .optional({ nullable: true })
        .isString()
        .withMessage('Gross weight must be a string'),
        
    body('products.*.boxWeight')
        .optional({ nullable: true })
        .isString()
        .withMessage('Box weight must be a string'),

    body('products.*.marketPrice')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Market price must be a non-negative number')
];

// Validation rules for updating an order
const updateOrderValidation = [
    param('id')
        .matches(/^ORD-\d{3}$/)
        .withMessage('Order ID must be in format ORD-XXX'),

    body('customerName')
        .notEmpty()
        .withMessage('Customer name is required')
        .isLength({ min: 2 })
        .withMessage('Customer name must be at least 2 characters long'),

    body('customerId')
        .notEmpty()
        .withMessage('Customer ID is required')
        .isInt({ min: 1 })
        .withMessage('Customer ID must be a positive integer'),

    body('orderReceivedDate')
        .notEmpty()
        .withMessage('Order received date is required')
        .isISO8601()
        .withMessage('Please provide a valid date in YYYY-MM-DD format'),

    body('packingDate')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Please provide a valid date in YYYY-MM-DD format'),

    body('packingDay')
        .optional({ nullable: true })
        .isString()
        .withMessage('Packing day must be a string'),

    body('orderType')
        .optional({ nullable: true })
        .isIn(['flight', 'local'])
        .withMessage('Order type must be flight or local'),

    body('detailsComment')
        .optional({ nullable: true })
        .isString()
        .withMessage('Details/Comment must be a string'),

    body('products')
        .optional({ nullable: true })
        .isArray({ min: 1 })
        .withMessage('At least one product is required'),

    body('products.*.productId')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Product ID must be a positive integer'),

    body('products.*.numBoxes')
        .optional({ nullable: true })
        .isString()
        .withMessage('Number of boxes must be a non-negative string'),

    body('products.*.packingType')
        .optional({ nullable: true })
        .isString()
        .withMessage('Packing type must be a string'),

    body('products.*.netWeight')
        .optional({ nullable: true })
        .isString()
        .withMessage('Net weight must be a string'),

    body('products.*.grossWeight')
        .optional({ nullable: true })
        .isString()
        .withMessage('Gross weight must be a string'),
        
    body('products.*.boxWeight')
        .optional({ nullable: true })
        .isString()
        .withMessage('Box weight must be a string'),

    body('products.*.marketPrice')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Market price must be a non-negative number')
];

// Validation rules for getting an order by ID
const getOrderByIdValidation = [
    param('id')
        .matches(/^ORD-\d{3}$/)
        .withMessage('Order ID must be in format ORD-XXX')
];

// Validation rules for deleting an order
const deleteOrderValidation = [
    param('id')
        .matches(/^ORD-\d{3}$/)
        .withMessage('Order ID must be in format ORD-XXX')
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    createOrderValidation,
    updateOrderValidation,
    getOrderByIdValidation,
    deleteOrderValidation,
    handleValidationErrors
};