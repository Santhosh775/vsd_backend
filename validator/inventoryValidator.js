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
        .if(body('category').not().equals('Tape'))
        .notEmpty().withMessage("Weight/Quantity is required")
        .isFloat({ min: 0 }).withMessage("Weight must be 0 or greater"),

    body("unit")
        .if(body('category').not().equals('Tape'))
        .notEmpty().withMessage("Unit type is required")
        .isIn(['kg', 'm', 'pcs', 'ltr']).withMessage("Invalid unit type"),

    body("color")
        .if(body('category').equals('Tape'))
        .notEmpty().withMessage("Color is required for tape")
        .isLength({ min: 2, max: 50 }).withMessage("Color must be 2-50 characters"),

    body("price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Price must be 0 or greater"),

];

exports.updateInventoryValidation = [
    body("name")
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage("Product name must be 2-100 characters"),

    body("category")
        .optional()
        .isIn(['Boxes', 'Bags', 'Tape', 'Paper', 'Plastic Covers']).withMessage("Invalid category"),

    body("weight")
        .if(body('category').exists().not().equals('Tape'))
        .optional()
        .isFloat({ min: 0 }).withMessage("Weight must be 0 or greater"),

    body("unit")
        .if(body('category').exists().not().equals('Tape'))
        .optional()
        .isIn(['kg', 'm', 'pcs', 'ltr']).withMessage("Invalid unit type"),

    body("color")
        .if(body('category').equals('Tape'))
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage("Color must be 2-50 characters"),

    body("price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Price must be 0 or greater"),

];

module.exports = { createInventoryValidation: exports.createInventoryValidation, updateInventoryValidation: exports.updateInventoryValidation, validate };
