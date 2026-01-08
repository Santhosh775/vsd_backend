const express = require('express');
const router = express.Router();
const customerController = require('../controller/customerController');
const { paginate } = require('../middleware/pagination');

router.post('/customers', customerController.createCustomer);
router.get('/customers', paginate, customerController.getAllCustomers);
router.get('/customers/:id', customerController.getCustomerById);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);

module.exports = router;
