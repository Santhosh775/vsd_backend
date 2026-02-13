const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');

// Create a new notification
router.post('/create',
    notificationController.createNotification
);

// Get all notifications for current admin
router.get('/list',
    notificationController.getNotifications
);

// Get a single notification by ID
router.get('/:id',
    notificationController.getNotificationById
);

// Mark a single notification as read
router.patch('/:id/read',
    notificationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch('/mark-all/read',
    notificationController.markAllAsRead
);

// Delete a single notification
router.delete('/:id',
    notificationController.deleteNotification
);

// Clear all notifications
router.delete('/',
    notificationController.clearNotifications
);

module.exports = router;

