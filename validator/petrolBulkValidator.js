const { body, validationResult } = require('express-validator');

const petrolBulkValidationRules = () => {
    return [
        body('name')
            .notEmpty()
            .withMessage('Petrol bulk name is required')
            .isLength({ min: 2, max: 255 })
            .withMessage('Name must be between 2 and 255 characters')
            .trim(),
        body('location')
            .notEmpty()
            .withMessage('Location is required')
            .isLength({ min: 2, max: 255 })
            .withMessage('Location must be between 2 and 255 characters')
            .trim(),
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
    petrolBulkValidationRules,
    validate
};