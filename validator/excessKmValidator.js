const { body, param, query } = require('express-validator');

exports.validateExcessKM = [
    body('driver_id')
        .notEmpty()
        .withMessage('Driver ID is required')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Date must be a valid date'),

    body('start_km')
        .notEmpty()
        .withMessage('Start KM is required')
        .isFloat({ min: 0 })
        .withMessage('Start KM must be a positive number'),

    body('end_km')
        .notEmpty()
        .withMessage('End KM is required')
        .isFloat({ min: 0 })
        .withMessage('End KM must be a positive number'),

    body('kilometers')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Kilometers must be a positive number'),

    body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
];

exports.validateExcessKMUpdate = [
    param('id')
        .isInt()
        .withMessage('Start / End KM ID must be an integer'),

    body('driver_id')
        .optional()
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid date'),

    body('start_km')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Start KM must be a positive number'),

    body('end_km')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('End KM must be a positive number'),

    body('kilometers')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Kilometers must be a positive number'),

    body('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
];

