const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a new notification
router.post('/create',
    authMiddleware,
    notificationController.createNotification
);

// Get all notifications for current admin
router.get('/list',
    authMiddleware,
    notificationController.getNotifications
);

// Get a single notification by ID
router.get('/:id',
    authMiddleware,
    notificationController.getNotificationById
);

// Mark a single notification as read
router.patch('/:id/read',
    authMiddleware,
    notificationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch('/mark-all/read',
    authMiddleware,
    notificationController.markAllAsRead
);

// Delete a single notification
router.delete('/:id',
    authMiddleware,
    notificationController.deleteNotification
);

// Clear all notifications
router.delete('/',
    authMiddleware,
    notificationController.clearNotifications
);

module.exports = router;

