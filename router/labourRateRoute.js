const express = require('express');
const router = express.Router();
const {
    getAllLabourRates,
    getLabourRateById,
    createLabourRate,
    updateLabourRate,
    deleteLabourRate
} = require('../controller/labourRateController');
const { labourRateValidationRules, validate } = require('../validator/labourRateValidator');

router.get('/list', getAllLabourRates);
router.get('/:id', getLabourRateById);
router.post('/create', labourRateValidationRules(), validate, createLabourRate);
router.put('/update/:id', labourRateValidationRules(), validate, updateLabourRate);
router.delete('/delete/:id', deleteLabourRate);

module.exports = router;
