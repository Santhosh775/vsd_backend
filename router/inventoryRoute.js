const express = require('express');
const router = express.Router();

const { createInventory, getAllInventory, getInventoryById, updateInventory, deleteInventory } = require('../controller/inventoryController');
const { createInventoryValidation, updateInventoryValidation, validate } = require('../validator/inventoryValidator');
const { paginate } = require('../middleware/pagination');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createInventoryValidation, validate, createInventory);
router.get('/list', paginate, getAllInventory);
router.get('/:id', authMiddleware, getInventoryById);
router.put('/:id', authMiddleware, updateInventoryValidation, validate, updateInventory);
router.delete('/:id', authMiddleware, deleteInventory);

module.exports = router;
