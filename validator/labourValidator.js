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

    body('work_type')
        .notEmpty()
        .withMessage('Work type is required')
        .isIn(['Normal', 'Medium', 'Heavy'])
        .withMessage('Work type must be Normal, Medium, or Heavy'),

    body('joining_date')
        .notEmpty()
        .withMessage('Joining date is required')
        .isISO8601()
        .withMessage('Joining date must be a valid date'),

    body('status')
        .optional()
        .isIn(['Active', 'Inactive'])
        .withMessage('Invalid status'),

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
        .withMessage('IFSC code must be 11 characters alphanumeric'),

    body('branch_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Branch name must be less than 100 characters')
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

    body('work_type')
        .optional()
        .isIn(['Normal', 'Medium', 'Heavy'])
        .withMessage('Work type must be Normal, Medium, or Heavy'),

    body('joining_date')
        .optional()
        .isISO8601()
        .withMessage('Joining date must be a valid date'),

    body('status')
        .optional()
        .isIn(['Active', 'Inactive'])
        .withMessage('Invalid status'),

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
        .withMessage('IFSC code must be 11 characters alphanumeric'),

    body('branch_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Branch name must be less than 100 characters')
];



exports.validateExcessPay = [
    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Date must be a valid date'),

    body('labour_name')
        .notEmpty()
        .withMessage('Labour name is required')
        .isLength({ max: 100 })
        .withMessage('Labour name must be less than 100 characters'),

    body('excess_hours')
        .notEmpty()
        .withMessage('Excess hours is required')
        .isFloat({ min: 0 })
        .withMessage('Excess hours must be a positive number'),

    body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number')
];

exports.validateExcessPayUpdate = [
    param('id')
        .isInt()
        .withMessage('Excess pay ID must be an integer'),

    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid date'),

    body('labour_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Labour name must be less than 100 characters'),

    body('excess_hours')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Excess hours must be a positive number'),

    body('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number')
];

exports.validateAttendance = [
    body('labour_id')
        .notEmpty()
        .withMessage('Labour ID is required')
        .isInt()
        .withMessage('Labour ID must be an integer'),

    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Date must be a valid date'),

    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['Present', 'Absent', 'Half Day', 'Checked-Out', 'informed leave', 'uninformed leave', 'leave', 'voluntary leave', 'normal absent'])
        .withMessage('Status must be Present, Absent, Half Day, Checked-Out, or Leave types'),

    body('check_in_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Check-in time must be in HH:MM:SS format'),

    body('check_out_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Check-out time must be in HH:MM:SS format')
];

exports.validateAttendanceUpdate = [
    param('id')
        .isInt()
        .withMessage('Attendance ID must be an integer'),

    body('status')
        .optional()
        .isIn(['Present', 'Absent', 'Half Day', 'Checked-Out', 'informed leave', 'uninformed leave', 'leave', 'voluntary leave', 'normal absent'])
        .withMessage('Status must be Present, Absent, Half Day, Checked-Out, or Leave types'),

    body('check_in_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Check-in time must be in HH:MM:SS format'),

    body('check_out_time')
        .optional()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Check-out time must be in HH:MM:SS format')
];

exports.validateMarkAbsent = [
    param('labour_id')
        .isInt()
        .withMessage('Labour ID must be an integer'),

    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid date'),

    body('type')
        .optional()
        .isIn(['informed leave', 'uninformed leave', 'leave', 'voluntary leave', 'normal absent', 'Absent'])
        .withMessage('Invalid absence type')
];


