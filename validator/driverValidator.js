const { body, param, query } = require('express-validator');

// ==================== DRIVER VALIDATORS ====================

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
        .isIn(['Local Pickups', 'Line Airport', 'Both Types'])
        .withMessage('Delivery type must be Local Pickups, Line Airport, or Both Types'),

    body('status')
        .optional()
        .isIn(['Available', 'On Trip', 'Break', 'Inactive'])
        .withMessage('Status must be Available, On Trip, Break, or Inactive'),

    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),

    body('total_deliveries')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total deliveries must be a non-negative integer'),

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
        .isIn(['Local Pickups', 'Line Airport', 'Both Types'])
        .withMessage('Delivery type must be Local Pickups, Line Airport, or Both Types'),

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

    body('total_deliveries')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Total deliveries must be a non-negative integer'),

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

// ==================== FUEL EXPENSE VALIDATORS ====================

exports.validateFuelExpense = [
    body('driver_id')
        .notEmpty()
        .withMessage('Driver ID is required')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('vehicle_number')
        .notEmpty()
        .withMessage('Vehicle number is required')
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

    body('fuel_type')
        .notEmpty()
        .withMessage('Fuel type is required')
        .isIn(['Petrol', 'Diesel'])
        .withMessage('Fuel type must be Petrol or Diesel'),

    body('petrol_bunk_name')
        .notEmpty()
        .withMessage('Petrol bunk name is required')
        .isLength({ max: 100 })
        .withMessage('Petrol bunk name must be less than 100 characters'),

    body('unit_price')
        .notEmpty()
        .withMessage('Unit price is required')
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a positive number'),

    body('litre')
        .notEmpty()
        .withMessage('Litre is required')
        .isFloat({ min: 0 })
        .withMessage('Litre must be a positive number')
];

exports.validateFuelExpenseUpdate = [
    param('id')
        .isInt()
        .withMessage('Fuel expense ID must be an integer'),

    body('driver_id')
        .optional()
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('vehicle_number')
        .optional()
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

    body('fuel_type')
        .optional()
        .isIn(['Petrol', 'Diesel'])
        .withMessage('Fuel type must be Petrol or Diesel'),

    body('petrol_bunk_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Petrol bunk name must be less than 100 characters'),

    body('unit_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a positive number'),

    body('litre')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Litre must be a positive number')
];

// ==================== EXCESS KM VALIDATORS ====================

exports.validateExcessKM = [
    body('driver_id')
        .notEmpty()
        .withMessage('Driver ID is required')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('vehicle_number')
        .notEmpty()
        .withMessage('Vehicle number is required')
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

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

    body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number')
];

exports.validateExcessKMUpdate = [
    param('id')
        .isInt()
        .withMessage('Excess KM ID must be an integer'),

    body('driver_id')
        .optional()
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('vehicle_number')
        .optional()
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

    body('start_km')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Start KM must be a positive number'),

    body('end_km')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('End KM must be a positive number'),

    body('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number')
];

// ==================== ADVANCE PAY VALIDATORS ====================

exports.validateAdvancePay = [
    body('driver_id')
        .notEmpty()
        .withMessage('Driver ID is required')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('advance_amount')
        .notEmpty()
        .withMessage('Advance amount is required')
        .isFloat({ min: 0 })
        .withMessage('Advance amount must be a positive number')
];

exports.validateAdvancePayUpdate = [
    param('id')
        .isInt()
        .withMessage('Advance pay ID must be an integer'),

    body('driver_id')
        .optional()
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('advance_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Advance amount must be a positive number')
];

// ==================== REMARK VALIDATORS ====================

exports.validateRemark = [
    body('driver_id')
        .notEmpty()
        .withMessage('Driver ID is required')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('vehicle_number')
        .notEmpty()
        .withMessage('Vehicle number is required')
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

    body('remarks')
        .notEmpty()
        .withMessage('Remarks are required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Remarks must be between 1 and 1000 characters')
];

exports.validateRemarkUpdate = [
    param('id')
        .isInt()
        .withMessage('Remark ID must be an integer'),

    body('driver_id')
        .optional()
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('vehicle_number')
        .optional()
        .isLength({ min: 5, max: 15 })
        .withMessage('Vehicle number must be 5-15 characters'),

    body('remarks')
        .optional()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Remarks must be between 1 and 1000 characters')
];

// ==================== ATTENDANCE VALIDATORS ====================

exports.validateCheckIn = [
    param('driver_id')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Time must be in HH:MM:SS format')
];

exports.validateCheckOut = [
    param('driver_id')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Time must be in HH:MM:SS format')
];

exports.validateMarkAttendance = [
    param('driver_id')
        .isInt()
        .withMessage('Driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('remarks')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Remarks must be less than 500 characters'),

    body('type')
        .optional()
        .isIn(['informed leave', 'uninformed leave', 'leave', 'voluntary leave', 'normal absent', 'Absent'])
        .withMessage('Invalid absence type')
];

exports.validateBulkMarkAttendance = [
    body('driver_ids')
        .notEmpty()
        .withMessage('Driver IDs array is required')
        .isArray()
        .withMessage('Driver IDs must be an array')
        .custom((value) => {
            if (value.length === 0) {
                throw new Error('Driver IDs array cannot be empty');
            }
            return true;
        }),

    body('driver_ids.*')
        .isInt()
        .withMessage('Each driver ID must be an integer'),

    body('date')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Date must be in YYYY-MM-DD format'),

    body('attendance_status')
        .notEmpty()
        .withMessage('Attendance status is required')
        .isIn(['Present', 'Absent', 'informed leave', 'uninformed leave', 'leave', 'voluntary leave', 'normal absent'])
        .withMessage('Invalid attendance status')
];

exports.validateAttendanceRemarks = [
    param('attendance_id')
        .isInt()
        .withMessage('Attendance ID must be an integer'),

    body('remarks')
        .notEmpty()
        .withMessage('Remarks are required')
        .isLength({ min: 1, max: 500 })
        .withMessage('Remarks must be between 1 and 500 characters')
];