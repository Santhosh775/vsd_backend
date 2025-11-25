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

exports.createCategoryValidation = [
    body("categoryname")
        .notEmpty().withMessage("Category name is required")
        .isLength({ min: 2, max: 50 }).withMessage("Category name must be 2-50 characters")
        .matches(/^[A-Za-z0-9\s_-]+$/).withMessage("Category name can contain only letters, numbers, spaces, _ and -"),

    body("categorydescription")
        .optional()
        .isLength({ max: 500 }).withMessage("Category description must not exceed 500 characters")
];

exports.updateCategoryValidation = [
    body("categoryname")
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage("Category name must be 2-50 characters")
        .matches(/^[A-Za-z0-9\s_-]+$/).withMessage("Category name can contain only letters, numbers, spaces, _ and -"),

    body("categorydescription")
        .optional()
        .isLength({ max: 500 }).withMessage("Category description must not exceed 500 characters"),

    body("category_status")
        .optional()
        .isIn(['active', 'inactive']).withMessage("Status must be active or inactive")
];

module.exports = { createCategoryValidation: exports.createCategoryValidation, updateCategoryValidation: exports.updateCategoryValidation, validate };