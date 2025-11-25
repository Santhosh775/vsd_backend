const { body, param } = require('express-validator');

exports.validateFarmer = [
    body('farmer_name')
        .notEmpty()
        .withMessage('Farmer name is required')
        .isLength({ max: 100 })
        .withMessage('Farmer name must be less than 100 characters'),

    body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be 10 digits'),

    body('secondary_phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Secondary phone number must be 10 digits'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email'),

    body('address')
        .notEmpty()
        .withMessage('Address is required'),

    body('city')
        .notEmpty()
        .withMessage('City is required'),

    body('state')
        .notEmpty()
        .withMessage('State is required'),

    body('pin_code')
        .notEmpty()
        .withMessage('Pin code is required')
        .matches(/^[0-9]{6}$/)
        .withMessage('Pin code must be 6 digits'),

    body('performance')
        .optional()
        .isIn(['excellent', 'good', 'average'])
        .withMessage('Performance must be excellent, good, or average'),

    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be active or inactive'),

    body('account_holder_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Account holder name must be less than 100 characters'),

    body('bank_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Bank name must be less than 100 characters'),

    body('account_number')
        .optional()
        .matches(/^[0-9]+$/)
        .withMessage('Account number must contain only digits'),

    body('IFSC_code')
        .optional()
        .matches(/^[A-Z0-9]{11}$/)
        .withMessage('IFSC code must be 11 characters alphanumeric')
];

exports.validateFarmerUpdate = [
    param('id')
        .isInt()
        .withMessage('Farmer ID must be an integer'),

    body('farmer_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Farmer name must be less than 100 characters'),

    body('phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be 10 digits'),

    body('secondary_phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Secondary phone number must be 10 digits'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email'),

    body('city')
        .optional(),

    body('state')
        .optional(),

    body('pin_code')
        .optional()
        .matches(/^[0-9]{6}$/)
        .withMessage('Pin code must be 6 digits'),

    body('performance')
        .optional()
        .isIn(['excellent', 'good', 'average'])
        .withMessage('Performance must be excellent, good, or average'),

    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be active or inactive'),

    body('account_holder_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Account holder name must be less than 100 characters'),

    body('bank_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Bank name must be less than 100 characters'),

    body('account_number')
        .optional()
        .matches(/^[0-9]+$/)
        .withMessage('Account number must contain only digits'),

    body('IFSC_code')
        .optional()
        .matches(/^[A-Z0-9]{11}$/)
        .withMessage('IFSC code must be 11 characters alphanumeric')
];