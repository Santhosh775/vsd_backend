const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
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

exports.createProductValidation = [
    body("product_name")
        .notEmpty().withMessage("Product name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Product name must be 2-100 characters"),

    body("category_id")
        .notEmpty().withMessage("Category is required")
        .isInt({ min: 1 }).withMessage("Category ID must be a valid integer"),

    body("unit")
        .notEmpty().withMessage("Unit is required")
        .isLength({ min: 1, max: 20 }).withMessage("Unit must be 1-20 characters"),

    body("current_price")
        .notEmpty().withMessage("Price is required")
        .isFloat({ min: 0.01 }).withMessage("Price must be greater than 0")
];

exports.updateProductValidation = [
    body("product_name")
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage("Product name must be 2-100 characters"),

    body("category_id")
        .optional()
        .isInt({ min: 1 }).withMessage("Category ID must be a valid integer"),

    body("unit")
        .optional()
        .isLength({ min: 1, max: 20 }).withMessage("Unit must be 1-20 characters"),

    body("current_price")
        .optional()
        .isFloat({ min: 0.01 }).withMessage("Price must be greater than 0"),

    body("product_status")
        .optional()
        .isIn(['active', 'inactive']).withMessage("Status must be active or inactive")
];

module.exports = { createProductValidation: exports.createProductValidation, updateProductValidation: exports.updateProductValidation, validate };