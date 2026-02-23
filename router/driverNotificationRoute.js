const express = require('express');
const router = express.Router();
const ctrl = require('../controller/driverNotificationController');

// Get all notifications for a driver (by did)
router.get('/driver/:did', ctrl.getDriverNotifications);

// Mark single notification as read
router.patch('/:id/read/:did', ctrl.markAsRead);

// Mark all as read for a driver
router.patch('/mark-all/read/:did', ctrl.markAllAsRead);

// Delete single notification
router.delete('/:id/:did', ctrl.deleteNotification);

// Clear all notifications for a driver
router.delete('/all/:did', ctrl.clearAll);

module.exports = router;
