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
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Phone number must be 10-15 digits'),

    body('email')
        .optional({ checkFalsy: true })
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
        .isLength({ min: 8, max: 20 })
        .withMessage('License number must be 8-20 characters'),

    body('vehicle_type')
        .notEmpty()
        .withMessage('Vehicle type is required'),

    body('available_vehicle')
        .notEmpty()
        .withMessage('Available vehicle is required'),

    body('vehicle_number')
        .notEmpty()
        .withMessage('Vehicle number is required')
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

    body('vehicle_condition')
        .optional()
        .isIn(['Excellent', 'Good', 'Average', 'Poor'])
        .withMessage('Vehicle condition must be Excellent, Good, Average, or Poor'),

    body('capacity')
        .notEmpty()
        .withMessage('Capacity is required'),

    body('insurance_number')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 })
        .withMessage('Insurance number must be less than 50 characters'),

    body('insurance_expiry_date')
        .optional({ checkFalsy: true })
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Insurance expiry date must be in YYYY-MM-DD format'),

    body('pollution_certificate')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 })
        .withMessage('Pollution certificate must be less than 50 characters'),

    body('ka_permit')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 })
        .withMessage('KA permit must be less than 50 characters'),

    body('delivery_type')
        .notEmpty()
        .withMessage('Delivery type is required')
        .isIn(['Collection Delivery', 'Airport Delivery', 'Both Types'])
        .withMessage('Delivery type must be Collection Delivery, Airport Delivery, or Both Types'),

    body('status')
        .optional()
        .isIn(['Available', 'On Trip', 'Break', 'Inactive'])
        .withMessage('Status must be Available, On Trip, Break, or Inactive'),

    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),

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
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Phone number must be 10-15 digits'),

    body('email')
        .optional({ checkFalsy: true })
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
        .isLength({ min: 8, max: 20 })
        .withMessage('License number must be 8-20 characters'),

    body('vehicle_type')
        .optional(),

    body('available_vehicle')
        .optional(),

    body('vehicle_number')
        .optional()
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

    body('vehicle_condition')
        .optional()
        .isIn(['Excellent', 'Good', 'Average', 'Poor'])
        .withMessage('Vehicle condition must be Excellent, Good, Average, or Poor'),

    body('capacity')
        .optional(),

    body('insurance_number')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 })
        .withMessage('Insurance number must be less than 50 characters'),

    body('insurance_expiry_date')
        .optional({ checkFalsy: true })
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Insurance expiry date must be in YYYY-MM-DD format'),

    body('pollution_certificate')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 })
        .withMessage('Pollution certificate must be less than 50 characters'),

    body('ka_permit')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 })
        .withMessage('KA permit must be less than 50 characters'),

    body('delivery_type')
        .optional()
        .isIn(['Collection Delivery', 'Airport Delivery', 'Both Types'])
        .withMessage('Delivery type must be Collection Delivery, Airport Delivery, or Both Types'),

    body('status')
        .optional()
        .isIn(['Available', 'On Trip', 'Break', 'Inactive'])
        .withMessage('Status must be Available, On Trip, Break, or Inactive'),

    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),

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

exports.validateDriverStatusUpdate = [
    param('id')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['Available', 'On Trip', 'Break', 'Inactive'])
        .withMessage('Status must be Available, On Trip, Break, or Inactive')
];

exports.validateWorkingHoursUpdate = [
    param('id')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('working_hours')
        .notEmpty()
        .withMessage('Working hours is required')
        .isFloat({ min: 0, max: 24 })
        .withMessage('Working hours must be between 0 and 24')
];