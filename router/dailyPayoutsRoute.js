const express = require('express');
const router = express.Router();
const {
    getPaidRecords,
    markAsPaid,
    getPayoutList
} = require('../controller/dailyPayoutsController');

// Get list of daily payouts (optional: ?type=driver&entity_id=5)
router.get('/list', getPayoutList);

// Get paid records for a type (optional: ?entity_id=5 for driver/labour)
router.get('/:type/paid', getPaidRecords);

// Mark a daily payout row as paid and store full row data
router.post('/:type/mark-paid', markAsPaid);

module.exports = router;
