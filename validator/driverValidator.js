const { body, param } = require('express-validator');

exports.validateDriver = [
    body('driver_name')
        .notEmpty()
        .withMessage('Driver name is required')
        .isLength({ max: 100 })
        .withMessage('Driver name must be less than 100 characters'),

    body('phone_number')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[0-9]{10,12}$/)
        .withMessage('Phone number must be 10-12 digits'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

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

    body('license_number')
        .notEmpty()
        .withMessage('License number is required')
        .isLength({ min: 10, max: 15 })
        .withMessage('License number must be 10-15 characters'),

    body('vehicle_type')
        .notEmpty(),

    body('vehicle_number')
        .notEmpty()
        .withMessage('Vehicle number is required')
        .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)
        .withMessage('Invalid vehicle number format (e.g., TN01AB1234)'),

    body('vehicle_condition')
        .optional()
        .isIn(['Excellent', 'Good', 'Average', 'Poor'])
        .withMessage('Vehicle condition must be Excellent, Good, Average, or Poor'),

    body('capacity')
        .notEmpty()
        .withMessage('Capacity is required'),

    body('insurance_number')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Insurance number must be less than 50 characters'),

    body('insurance_expiry_date')
        .optional()
        .isISO8601()
        .withMessage('Invalid insurance expiry date format'),

    body('delivery_type')
        .notEmpty()
        .withMessage('Delivery type is required')
        .isIn(['Collection Delivery', 'Airport Delivery', 'Both Types'])
        .withMessage('Delivery type must be Collection Delivery, Airport Delivery, or Both Types'),

    body('status')
        .optional()
        .isIn(['Available', 'On Trip', 'Break', 'Inactive'])
        .withMessage('Status must be Available, On Trip, Break, or Inactive'),

    body('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),

    body('working_hours')
        .optional()
        .isFloat({ min: 0, max: 24 })
        .withMessage('Working hours must be between 0 and 24'),

    body('total_deliveries')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total deliveries must be a non-negative integer')
];

exports.validateDriverUpdate = [
    param('id')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('driver_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Driver name must be less than 100 characters'),

    body('phone_number')
        .optional()
        .matches(/^\+?[0-9]{10,12}$/)
        .withMessage('Phone number must be 10-12 digits'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email'),

    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    body('address')
        .optional(),

    body('city')
        .optional(),

    body('state')
        .optional(),

    body('pin_code')
        .optional()
        .matches(/^[0-9]{6}$/)
        .withMessage('Pin code must be 6 digits'),

    body('license_number')
        .optional()
        .isLength({ min: 10, max: 15 })
        .withMessage('License number must be 10-15 characters'),

    body('vehicle_type')
        .optional(),

    body('vehicle_number')
        .optional()
        .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/)
        .withMessage('Invalid vehicle number format (e.g., TN01AB1234)'),

    body('vehicle_condition')
        .optional()
        .isIn(['Excellent', 'Good', 'Average', 'Poor'])
        .withMessage('Vehicle condition must be Excellent, Good, Average, or Poor'),

    body('capacity')
        .optional(),

    body('insurance_number')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Insurance number must be less than 50 characters'),

    body('insurance_expiry_date')
        .optional()
        .isISO8601()
        .withMessage('Invalid insurance expiry date format'),

    body('delivery_type')
        .optional()
        .isIn(['Collection Delivery', 'Airport Delivery', 'Both Types'])
        .withMessage('Delivery type must be Collection Delivery, Airport Delivery, or Both Types'),

    body('status')
        .optional()
        .isIn(['Available', 'On Trip', 'Break', 'Inactive'])
        .withMessage('Status must be Available, On Trip, Break, or Inactive'),

    body('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),

    body('working_hours')
        .optional()
        .isFloat({ min: 0, max: 24 })
        .withMessage('Working hours must be between 0 and 24'),

    body('total_deliveries')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total deliveries must be a non-negative integer')
];