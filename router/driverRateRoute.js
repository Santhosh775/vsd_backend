const express = require('express');
const router = express.Router();
const {
    getAllDriverRates,
    getDriverRateById,
    createDriverRate,
    updateDriverRate,
    deleteDriverRate
} = require('../controller/driverRateController');
const { driverRateValidationRules, driverRateUpdateValidationRules, validate } = require('../validator/driverRateValidator');

router.get('/list', getAllDriverRates);
router.get('/:id', getDriverRateById);
router.post('/create', driverRateValidationRules(), validate, createDriverRate);
router.put('/update/:id', validate, updateDriverRate);
router.delete('/delete/:id', deleteDriverRate);

module.exports = router;