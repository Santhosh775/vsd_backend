const { body, param, query } = require('express-validator');

exports.validateLabour = [
    body('full_name')
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ max: 100 })
        .withMessage('Full name must be less than 100 characters'),

    body('mobile_number')
        .notEmpty()
        .withMessage('Mobile number is required')
        .matches(/^[0-9]{10}$/)
        .withMessage('Mobile number must be 10 digits'),

    body('aadhaar_number')
        .optional()
        .matches(/^[0-9]{12}$/)
        .withMessage('Aadhaar number must be 12 digits'),

    body('date_of_birth')
        .notEmpty()
        .withMessage('Date of birth is required')
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),

    body('gender')
        .notEmpty()
        .withMessage('Gender is required')
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),

    body('blood_group')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),

    body('address')
        .notEmpty()
        .withMessage('Address is required'),

    body('department')
        .notEmpty()
        .withMessage('Department is required')
        .isIn(['Packing', 'Loading', 'Unloading'])
        .withMessage('Department must be Packing, Loading, or Unloading'),

    body('daily_wage')
        .notEmpty()
        .withMessage('Daily wage is required')
        .isFloat({ min: 0 })
        .withMessage('Daily wage must be a positive number'),

    body('joining_date')
        .notEmpty()
        .withMessage('Joining date is required')
        .isISO8601()
        .withMessage('Joining date must be a valid date'),

    body('status')
        .optional()
        .isIn(['Present', 'Absent', 'Half Day', 'Active', 'Inactive'])
        .withMessage('Invalid status'),

    body('order_id')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Order ID must be less than 50 characters'),

    body('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),

    body('work_type')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Work type must be less than 50 characters'),

    body('check_in_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Check-in time must be in HH:MM format'),

    body('check_out_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Check-out time must be in HH:MM format')
];

exports.validateLabourUpdate = [
    param('id')
        .isInt()
        .withMessage('Labour ID must be an integer'),

    body('full_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Full name must be less than 100 characters'),

    body('mobile_number')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Mobile number must be 10 digits'),

    body('aadhaar_number')
        .optional()
        .matches(/^[0-9]{12}$/)
        .withMessage('Aadhaar number must be 12 digits'),

    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),

    body('gender')
        .optional()
        .isIn(['Male', 'Female', 'Other'])
        .withMessage('Gender must be Male, Female, or Other'),

    body('blood_group')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),

    body('address')
        .optional(),

    body('department')
        .optional()
        .isIn(['Packing', 'Loading', 'Unloading'])
        .withMessage('Department must be Packing, Loading, or Unloading'),

    body('daily_wage')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Daily wage must be a positive number'),

    body('joining_date')
        .optional()
        .isISO8601()
        .withMessage('Joining date must be a valid date'),

    body('status')
        .optional()
        .isIn(['Present', 'Absent', 'Half Day', 'Active', 'Inactive'])
        .withMessage('Invalid status'),

    body('order_id')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Order ID must be less than 50 characters'),

    body('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),

    body('work_type')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Work type must be less than 50 characters'),

    body('check_in_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Check-in time must be in HH:MM format'),

    body('check_out_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Check-out time must be in HH:MM format')
];

exports.validateAttendance = [
    param('id')
        .isInt()
        .withMessage('Labour ID must be an integer'),

    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['Present', 'Absent', 'Half Day'])
        .withMessage('Status must be Present, Absent, or Half Day'),

    body('check_in_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Check-in time must be in HH:MM format'),

    body('check_out_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Check-out time must be in HH:MM format')
];

exports.validateWorkAssignment = [
    param('id')
        .isInt()
        .withMessage('Labour ID must be an integer'),

    body('order_id')
        .notEmpty()
        .withMessage('Order ID is required')
        .isLength({ max: 50 })
        .withMessage('Order ID must be less than 50 characters'),

    body('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),

    body('work_type')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Work type must be less than 50 characters')
];

exports.validateSearch = [
    query('query')
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters')
];