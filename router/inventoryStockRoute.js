const express = require('express');
const router = express.Router();
const inventoryStockController = require('../controller/inventoryStockController');

router.post('/', inventoryStockController.createInventoryStock);
router.get('/', inventoryStockController.getAllInventoryStocks);
router.get('/inventory-quantities', inventoryStockController.getInventoryQuantities);
router.get('/company-totals/:company_id', inventoryStockController.getCompanyTotals);
router.get('/:id', inventoryStockController.getInventoryStockById);
router.put('/:id', inventoryStockController.updateInventoryStock);
router.delete('/:id', inventoryStockController.deleteInventoryStock);

module.exports = router;
