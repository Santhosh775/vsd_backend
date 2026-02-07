const express = require('express');
const router = express.Router();
const {
  createVegetableAvailability,
  getVegetableAvailabilityByFarmer,
  getVegetableHistoryByFarmer,
  updateVegetableAvailability,
  deleteVegetableAvailability
} = require('../controller/vegetableAvailabilityController');
const { validateVegetableAvailability } = require('../validator/vegetableAvailabilityValidator');

router.post('/create', validateVegetableAvailability, createVegetableAvailability);
router.get('/farmer/:farmerId/history', getVegetableHistoryByFarmer);
router.get('/farmer/:farmerId', getVegetableAvailabilityByFarmer);
router.put('/:id', validateVegetableAvailability, updateVegetableAvailability);
router.delete('/:id', deleteVegetableAvailability);

module.exports = router;
