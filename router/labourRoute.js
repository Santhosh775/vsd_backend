const express = require('express');
const router = express.Router();
const labourController = require('../controller/labourController');
const { validateLabour, validateLabourUpdate, validateAttendance, validateWorkAssignment } = require('../validator/labourValidator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadLabour } = require('../middleware/upload');

// Create a new labour (Admin only)
router.post('/create', 
    authMiddleware, 
    uploadLabour.single('profile_image'),
    validateLabour,
    labourController.createLabour
);

// Get all labours (Admin only)
router.get('/list', 
    authMiddleware, 
    labourController.getAllLabours
);

// Get labour by ID (Admin only)
router.get('/:id', 
    authMiddleware, 
    labourController.getLabourById
);

// Update labour by ID (Admin only)
router.put('/:id', 
    authMiddleware, 
    uploadLabour.single('profile_image'),
    validateLabourUpdate,
    labourController.updateLabour
);

// Delete labour by ID (Admin only)
router.delete('/:id', 
    authMiddleware, 
    labourController.deleteLabour
);

// Search labours (Admin only)
router.get('/search/query', 
    authMiddleware, 
    labourController.searchLabours
);

// Mark attendance (Admin only)
router.patch('/:id/attendance', 
    authMiddleware,
    validateAttendance,
    labourController.markAttendance
);

// Assign work to labour (Admin only)
router.patch('/:id/assign-work', 
    authMiddleware,
    validateWorkAssignment,
    labourController.assignWork
);

// Get attendance statistics (Admin only)
router.get('/stats/attendance', 
    authMiddleware, 
    labourController.getAttendanceStats
);

// Get labour summary statistics (Admin only)
router.get('/stats/summary', 
    authMiddleware, 
    labourController.getLabourStats
);

module.exports = router;