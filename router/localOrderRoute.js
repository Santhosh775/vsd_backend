const express = require('express');
const router = express.Router();
const localOrderController = require('../controller/localOrderController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/:orderId', authMiddleware, localOrderController.getLocalOrder);
router.post('/:orderId', authMiddleware, localOrderController.saveLocalOrder);
router.get('/', authMiddleware, localOrderController.getAllLocalOrders);

module.exports = router;
