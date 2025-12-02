const express = require('express');
const router = express.Router();
const driverController = require('../controller/driverController');
const { 
    validateDriver, 
    validateDriverUpdate,
    validateDriverStatusUpdate,
    validateWorkingHoursUpdate
} = require('../validator/driverValidator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadDriver } = require('../middleware/upload');

// Driver login (Public route)
router.post('/login', driverController.driverLogin);

// Get driver profile by ID (Driver can access their own profile)
router.get('/profile/:id', driverController.driverProfile);


// Create a new driver (Admin only)
router.post('/create', 
    authMiddleware, 
    uploadDriver.fields([
        { name: 'driver_image', maxCount: 1 },
        { name: 'license_image', maxCount: 1 },
        { name: 'driver_id_proof', maxCount: 1 }
    ]),
    validateDriver,
    driverController.createDriver
);

// Get all drivers (Admin only)
router.get('/list', 
    authMiddleware, 
    driverController.getAllDrivers
);

// Search drivers (Admin only)
router.get('/search/query', 
    authMiddleware, 
    driverController.searchDrivers
);

// Get drivers by delivery type (Admin only)
router.get('/delivery-type/:delivery_type', 
    authMiddleware, 
    driverController.getDriversByDeliveryType
);

// Get drivers by status (Admin only)
router.get('/status/:status', 
    authMiddleware, 
    driverController.getDriversByStatus
);

// Get driver by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    driverController.getDriverById
);

// Update driver by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    uploadDriver.fields([
        { name: 'driver_image', maxCount: 1 },
        { name: 'license_image', maxCount: 1 },
        { name: 'driver_id_proof', maxCount: 1 }
    ]),
    validateDriverUpdate,
    driverController.updateDriver
);

// Update driver status (Admin only)
router.patch('/:id/status', 
    authMiddleware,
    validateDriverStatusUpdate,
    driverController.updateDriverStatus
);

// Update working hours (Admin only)
router.patch('/:id/working-hours', 
    authMiddleware,
    validateWorkingHoursUpdate,
    driverController.updateWorkingHours
);

// Toggle driver active/inactive status (Admin only)
router.patch('/:id/toggle-status', 
    authMiddleware,
    driverController.toggleDriverStatus
);

// Delete driver by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    driverController.deleteDriver
);

module.exports = router;