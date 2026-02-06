const express = require('express');
const router = express.Router();
const localOrderController = require('../controller/localOrderController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get local orders for a driver (by driverId in summary_data) – must be before /:orderId
router.get('/driver/:driverId', authMiddleware, localOrderController.getDriverLocalOrders);

router.get('/:orderId', authMiddleware, localOrderController.getLocalOrder);
router.post('/:orderId', authMiddleware, localOrderController.saveLocalOrder);
router.get('/', authMiddleware, localOrderController.getAllLocalOrders);

module.exports = router;
