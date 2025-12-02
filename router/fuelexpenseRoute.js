const express = require('express');
const router = express.Router();
const fuelExpenseController = require('../controller/fuelexpenseController');
const { 
    validateFuelExpense, 
    validateFuelExpenseUpdate 
} = require('../validator/driverValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a new fuel expense (Admin only)
router.post('/create', 
    authMiddleware, 
    validateFuelExpense,
    fuelExpenseController.createFuelExpense
);

// Get all fuel expenses (Admin only)
router.get('/list', 
    authMiddleware, 
    fuelExpenseController.getAllFuelExpenses
);

// Get fuel expense statistics (Admin only)
router.get('/stats', 
    authMiddleware, 
    fuelExpenseController.getFuelExpenseStats
);

// Get fuel expenses by date range (Admin only)
router.get('/date-range', 
    authMiddleware, 
    fuelExpenseController.getFuelExpensesByDateRange
);

// Get fuel expenses by fuel type (Admin only)
router.get('/fuel-type/:fuel_type', 
    authMiddleware, 
    fuelExpenseController.getFuelExpensesByFuelType
);

// Get fuel expenses by driver ID (Admin only)
router.get('/driver/:driver_id', 
    authMiddleware, 
    fuelExpenseController.getFuelExpensesByDriverId
);

// Get fuel expense by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    fuelExpenseController.getFuelExpenseById
);

// Update fuel expense by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    validateFuelExpenseUpdate,
    fuelExpenseController.updateFuelExpense
);

// Delete fuel expense by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    fuelExpenseController.deleteFuelExpense
);

module.exports = router;