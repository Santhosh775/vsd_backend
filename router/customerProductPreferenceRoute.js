const express = require('express');
const router = express.Router();
const preferenceController = require('../controller/customerProductPreferenceController');

router.post('/preferences', preferenceController.createPreference);
router.get('/preferences/customer/:customerId', preferenceController.getPreferencesByCustomer);
router.put('/preferences/:customer_id/:product_id', preferenceController.updatePreference);
router.delete('/preferences/:customer_id/:product_id', preferenceController.deletePreference);
router.post('/preferences/bulk', preferenceController.bulkUpdatePreferences);

module.exports = router;
