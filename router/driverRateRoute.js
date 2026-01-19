const express = require('express');
const router = express.Router();
const {
    getAllDriverRates,
    getDriverRateById,
    createDriverRate,
    updateDriverRate,
    deleteDriverRate
} = require('../controller/driverRateController');
const { driverRateValidationRules, validate } = require('../validator/driverRateValidator');

router.get('/list', getAllDriverRates);
router.get('/:id', getDriverRateById);
router.post('/create', driverRateValidationRules(), validate, createDriverRate);
router.put('/update/:id', driverRateValidationRules(), validate, updateDriverRate);
router.delete('/delete/:id', deleteDriverRate);

module.exports = router;
