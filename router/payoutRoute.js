const express = require('express');
const router = express.Router();
const { getPaidRecords, markAsPaid, getPayoutList } = require('../controller/payoutController');

// Get all paid payouts (optional filter by type): GET /api/v1/payout/list?type=farmer
router.get('/list', getPayoutList);

// Get paid records for a type (for frontend to merge status): GET /api/v1/payout/:type/paid
router.get('/:type/paid', getPaidRecords);

// Mark a payout row as paid and store full row: POST /api/v1/payout/:type/mark-paid
router.post('/:type/mark-paid', markAsPaid);

module.exports = router;
