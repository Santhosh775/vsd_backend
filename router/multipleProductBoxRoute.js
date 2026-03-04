const express = require('express');
const router = express.Router();

const {
    createMultipleProductBox,
    getAllMultipleProductBoxes,
    getMultipleProductBoxById,
    updateMultipleProductBox,
    deleteMultipleProductBox
} = require('../controller/multipleProductBoxController');

// Create a new multiple product box
router.post('/', createMultipleProductBox);

// Get all multiple product boxes
router.get('/', getAllMultipleProductBoxes);

// Get a single multiple product box by ID
router.get('/:id', getMultipleProductBoxById);

// Update a multiple product box
router.put('/:id', updateMultipleProductBox);

// Delete a multiple product box
router.delete('/:id', deleteMultipleProductBox);

module.exports = router;

