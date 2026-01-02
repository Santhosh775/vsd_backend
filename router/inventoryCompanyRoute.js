const express = require('express');
const router = express.Router();
const inventoryCompanyController = require('../controller/inventoryCompanyController');

router.post('/', inventoryCompanyController.createCompany);
router.get('/', inventoryCompanyController.getAllCompanies);
router.get('/:id', inventoryCompanyController.getCompanyById);
router.put('/:id', inventoryCompanyController.updateCompany);
router.delete('/:id', inventoryCompanyController.deleteCompany);

module.exports = router;
