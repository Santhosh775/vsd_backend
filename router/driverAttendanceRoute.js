const express = require('express');
const router = express.Router();
const attendanceController = require('../controller/driverAttendanceController');
const { 
    validateCheckIn,
    validateCheckOut,
    validateMarkAttendance,
    validateBulkMarkAttendance,
    validateAttendanceRemarks
} = require('../validator/driverValidator');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get attendance overview (main dashboard view)
router.get('/overview', 
    authMiddleware, 
    attendanceController.getAttendanceOverview
);

// Mark driver check-in
router.post('/check-in/:driver_id', 
    authMiddleware,
    validateCheckIn,
    attendanceController.markCheckIn
);

// Mark driver check-out
router.post('/check-out/:driver_id', 
    authMiddleware,
    validateCheckOut,
    attendanceController.markCheckOut
);

// Mark driver as present
router.post('/mark-present/:driver_id', 
    authMiddleware,
    validateMarkAttendance,
    attendanceController.markPresent
);

// Mark driver as absent
router.post('/mark-absent/:driver_id', 
    authMiddleware,
    validateMarkAttendance,
    attendanceController.markAbsent
);

// Get attendance history for a specific driver
router.get('/history/:driver_id', 
    authMiddleware, 
    attendanceController.getDriverAttendanceHistory
);

// Get attendance statistics for a specific driver
router.get('/stats/:driver_id', 
    authMiddleware, 
    attendanceController.getDriverAttendanceStats
);

// Get attendance report for all drivers
router.get('/report', 
    authMiddleware, 
    attendanceController.getAttendanceReport
);

// Bulk mark attendance (mark multiple drivers at once)
router.post('/bulk-mark', 
    authMiddleware,
    validateBulkMarkAttendance,
    attendanceController.bulkMarkAttendance
);

// Update attendance remarks
router.patch('/remarks/:attendance_id', 
    authMiddleware,
    validateAttendanceRemarks,
    attendanceController.updateAttendanceRemarks
);

// Delete attendance record
router.delete('/:attendance_id', 
    authMiddleware, 
    attendanceController.deleteAttendanceRecord
);

// Get drivers who are present today
router.get('/present-today', 
    authMiddleware, 
    attendanceController.getPresentDriversToday
);

module.exports = router;