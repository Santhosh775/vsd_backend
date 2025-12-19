const express = require('express');
const router = express.Router();
const labourAttendanceController = require('../controller/labourAttendanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/overview', 
    authMiddleware,
    labourAttendanceController.getAttendanceOverview
);

router.post('/:labour_id/mark-present', 
    authMiddleware,
    labourAttendanceController.markPresent
);

router.post('/:labour_id/check-out', 
    authMiddleware,
    labourAttendanceController.markCheckOut
);

router.post('/:labour_id/mark-absent', 
    authMiddleware,
    labourAttendanceController.markAbsent
);

router.get('/stats', 
    authMiddleware, 
    labourAttendanceController.getAttendanceStats
);

router.get('/present-today', 
    authMiddleware, 
    labourAttendanceController.getPresentLaboursToday
);

module.exports = router;
