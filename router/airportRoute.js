const express = require('express');
const router = express.Router();
const airportController = require('../controller/airportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, airportController.createAirport);
router.get('/list', authMiddleware, airportController.getAllAirports);
router.get('/search/query', authMiddleware, airportController.searchAirports);
router.get('/:id', authMiddleware, airportController.getAirportById);
router.put('/:id', authMiddleware, airportController.updateAirport);
router.delete('/:id', authMiddleware, airportController.deleteAirport);

module.exports = router;
