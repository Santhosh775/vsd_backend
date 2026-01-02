const express = require('express');
const router = express.Router();
const sellStockController = require('../controller/sellStockController');

router.post('/', sellStockController.createSellStock);
router.get('/', sellStockController.getAllSellStocks);
router.get('/:id', sellStockController.getSellStockById);
router.put('/:id', sellStockController.updateSellStock);
router.delete('/:id', sellStockController.deleteSellStock);

module.exports = router;
