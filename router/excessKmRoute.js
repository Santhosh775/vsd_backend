const express = require('express');
const router = express.Router();
const excessKmController = require('../controller/excessKmController');
const { validateExcessKM, validateExcessKMUpdate } = require('../validator/excessKmValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create Start / End KM record
router.post('/create',
    authMiddleware,
    validateExcessKM,
    excessKmController.createExcessKM
);

// Get all Start / End KM records (with optional filters)
router.get('/list',
    authMiddleware,
    excessKmController.getAllExcessKMs
);

// Get Start / End KM records by driver ID
router.get('/driver/:driverId',
    authMiddleware,
    excessKmController.getExcessKMsByDriverId
);

// Get Start / End KM record by ID
router.get('/:id',
    authMiddleware,
    excessKmController.getExcessKMById
);

// Update Start / End KM record
router.put('/:id',
    authMiddleware,
    validateExcessKMUpdate,
    excessKmController.updateExcessKM
);

// Delete Start / End KM record
router.delete('/:id',
    authMiddleware,
    excessKmController.deleteExcessKM
);

module.exports = router;

