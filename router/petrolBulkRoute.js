const express = require('express');
const router = express.Router();
const {
    getAllPetrolBulks,
    getPetrolBulkById,
    createPetrolBulk,
    updatePetrolBulk,
    deletePetrolBulk
} = require('../controller/petrolBulkController');
const { petrolBulkValidationRules, validate } = require('../validator/petrolBulkValidator');

// Get all petrol bulks with pagination and search
router.get('/list', getAllPetrolBulks);

// Get petrol bulk by ID
router.get('/:id', getPetrolBulkById);

// Create new petrol bulk
router.post('/create', petrolBulkValidationRules(), validate, createPetrolBulk);

// Update petrol bulk
router.put('/update/:id', petrolBulkValidationRules(), validate, updatePetrolBulk);

// Delete petrol bulk
router.delete('/delete/:id', deletePetrolBulk);

module.exports = router;