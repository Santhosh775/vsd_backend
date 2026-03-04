const { body, validationResult } = require('express-validator');

const driverRateValidationRules = () => {
    return [
        body('deliveryType')
            .notEmpty().withMessage('Delivery type is required')
            .isIn(['LOCAL GRADE ORDER', 'BOX ORDER', 'Both Types'])
            .withMessage('Invalid delivery type'),
        body('amount')
            .notEmpty().withMessage('Amount is required')
            .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
        body('kilometer')
            .optional({ values: 'falsy' })
            .isFloat({ min: 0 }).withMessage('Kilometer must be a positive number'),
        body('kilometers')
            .optional({ values: 'falsy' })
            .isFloat({ min: 0 }).withMessage('Kilometers must be a positive number'),
        body('status')
            .optional()
            .isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive')
    ];
};

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

module.exports = {
    driverRateValidationRules,
    validate
};