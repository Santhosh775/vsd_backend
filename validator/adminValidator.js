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

// Register validation
exports.registerValidation = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),

    body("username")
        .notEmpty().withMessage("Username is required")
        .matches(/^[A-Za-z0-9_-]+$/).withMessage("Username can contain only letters, numbers, _ and -")
        .isLength({ min: 3, max: 20 }).withMessage("Username must be 3–20 characters"),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),

    body("role")
        .optional()
        .isIn(["admin", "superadmin"]).withMessage("Invalid role")
];

// Login validation
exports.loginValidation = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
];

module.exports = { registerValidation: exports.registerValidation, loginValidation: exports.loginValidation, validate };
