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

exports.createInventoryValidation = [
    body("name")
        .notEmpty().withMessage("Product name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Product name must be 2-100 characters"),

    body("category")
        .notEmpty().withMessage("Category is required")
        .isIn(['Boxes', 'Bags', 'Tape', 'Paper', 'Plastic Covers']).withMessage("Invalid category"),

    body("weight")
        .notEmpty().withMessage("Weight/Quantity is required")
        .isFloat({ min: 0.01 }).withMessage("Weight must be greater than 0"),

    body("unit")
        .notEmpty().withMessage("Unit type is required")
        .isIn(['kg', 'm', 'pcs', 'ltr']).withMessage("Invalid unit type"),

    body("price")
        .notEmpty().withMessage("Price is required")
        .isFloat({ min: 0.01 }).withMessage("Price must be greater than 0")
];

exports.updateInventoryValidation = [
    body("name")
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage("Product name must be 2-100 characters"),

    body("category")
        .optional()
        .isIn(['Boxes', 'Bags', 'Tape', 'Paper', 'Plastic Covers']).withMessage("Invalid category"),

    body("weight")
        .optional()
        .isFloat({ min: 0.01 }).withMessage("Weight must be greater than 0"),

    body("unit")
        .optional()
        .isIn(['kg', 'm', 'pcs', 'ltr']).withMessage("Invalid unit type"),

    body("price")
        .optional()
        .isFloat({ min: 0.01 }).withMessage("Price must be greater than 0")
];

module.exports = { createInventoryValidation: exports.createInventoryValidation, updateInventoryValidation: exports.updateInventoryValidation, validate };
