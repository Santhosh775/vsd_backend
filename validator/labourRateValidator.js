const { body, validationResult } = require('express-validator');

const labourRateValidationRules = () => {
    return [
        body('labourType')
            .notEmpty()
            .withMessage('Labour type is required')
            .isIn(['Normal', 'Medium', 'Heavy'])
            .withMessage('Labour type must be Normal, Medium, or Heavy'),
        body('amount')
            .notEmpty()
            .withMessage('Amount is required')
            .isFloat({ min: 0 })
            .withMessage('Amount must be a positive number'),
        body('status')
            .optional()
            .isIn(['Active', 'Inactive'])
            .withMessage('Status must be either Active or Inactive')
    ];
};

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

module.exports = {
    labourRateValidationRules,
    validate
};
