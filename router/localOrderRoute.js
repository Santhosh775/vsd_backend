const express = require('express');
const router = express.Router();
const localOrderController = require('../controller/localOrderController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/:orderId', authMiddleware, localOrderController.getLocalOrder);
router.post('/:orderId', authMiddleware, localOrderController.saveLocalOrder);
router.get('/', authMiddleware, localOrderController.getAllLocalOrders);

// Update status for driver app
router.patch('/:orderId/status/:driverId/:oiid', authMiddleware, localOrderController.updateLocalOrderStatus);

// Delete local order
router.delete('/:id', authMiddleware, localOrderController.deleteLocalOrder);

module.exports = router;
