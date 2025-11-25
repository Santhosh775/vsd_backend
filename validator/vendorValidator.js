const { body, param } = require('express-validator');

exports.validateVendor = [
    body('vendor_name')
        .notEmpty()
        .withMessage('Vendor name is required')
        .isLength({ max: 100 })
        .withMessage('Vendor name must be less than 100 characters'),

    body('vendor_type')
        .notEmpty()
        .withMessage('Vendor type is required')
        .isIn(['farmer', 'supplier', 'thirdparty'])
        .withMessage('Vendor type must be farmer, supplier, or thirdparty'),

    body('registration_number')
        .notEmpty()
        .withMessage('Registration number is required')
        .isLength({ min: 3 })
        .withMessage('Registration number must be at least 3 characters long'),

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

    body('contact_person')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Contact person name must be less than 100 characters'),

    body('tape_color')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Tape color must be less than 50 characters'),

    body('dealing_person')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Dealing person name must be less than 100 characters'),

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

exports.validateVendorUpdate = [
    param('id')
        .isInt()
        .withMessage('Vendor ID must be an integer'),

    body('vendor_name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Vendor name must be less than 100 characters'),

    body('vendor_type')
        .optional()
        .isIn(['farmer', 'supplier', 'thirdparty'])
        .withMessage('Vendor type must be farmer, supplier, or thirdparty'),

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

    body('contact_person')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Contact person name must be less than 100 characters'),

    body('tape_color')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Tape color must be less than 50 characters'),

    body('dealing_person')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Dealing person name must be less than 100 characters'),

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