const express = require('express');
const router = express.Router();
const fuelExpenseController = require('../controller/fuelexpenseController');
const { 
    validateFuelExpense, 
    validateFuelExpenseUpdate 
} = require('../validator/driverValidator');

// Create a new fuel expense
router.post('/create', 
    validateFuelExpense,
    fuelExpenseController.createFuelExpense
);

// Get all fuel expenses
router.get('/list', 
    fuelExpenseController.getAllFuelExpenses
);

// Get fuel expense statistics
router.get('/stats', 
    fuelExpenseController.getFuelExpenseStats
);

// Get fuel expenses by date range
router.get('/date-range', 
    fuelExpenseController.getFuelExpensesByDateRange
);

// Get fuel expenses by fuel type
router.get('/fuel-type/:fuel_type', 
    fuelExpenseController.getFuelExpensesByFuelType
);

// Get fuel expenses by driver ID
router.get('/driver/:driver_id', 
    fuelExpenseController.getFuelExpensesByDriverId
);

// Get fuel expense by ID
router.get('/:id', 
    fuelExpenseController.getFuelExpenseById
);

// Update fuel expense by ID
router.put('/:id', 
    validateFuelExpenseUpdate,
    fuelExpenseController.updateFuelExpense
);

// Delete fuel expense by ID
router.delete('/:id', 
    fuelExpenseController.deleteFuelExpense
);

module.exports = router;