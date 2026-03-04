const express = require('express');
const router = express.Router();
const excessKmController = require('../controller/excessKmController');
const { validateExcessKM, validateExcessKMUpdate } = require('../validator/excessKmValidator');

// Create Start / End KM record
router.post('/create',
    validateExcessKM,
    excessKmController.createExcessKM
);

// Get all Start / End KM records (with optional filters)
router.get('/list',
    excessKmController.getAllExcessKMs
);

// Get Start / End KM records by driver ID
router.get('/driver/:driverId',
    excessKmController.getExcessKMsByDriverId
);

// Get Start / End KM record by ID
router.get('/:id',
    excessKmController.getExcessKMById
);

// Update Start / End KM record
router.put('/:id',
    validateExcessKMUpdate,
    excessKmController.updateExcessKM
);

// Delete Start / End KM record
router.delete('/:id',
    excessKmController.deleteExcessKM
);

module.exports = router;

