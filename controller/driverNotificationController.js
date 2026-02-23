const DriverNotification = require('../model/driverNotificationModel');

// Get all notifications for a driver
exports.getDriverNotifications = async (req, res) => {
    try {
        const did = parseInt(req.params.did);
        if (!did) return res.status(400).json({ success: false, message: 'Driver ID required' });

        const notifications = await DriverNotification.findAll({
            where: { did },
            order: [['created_at', 'DESC']],
            limit: 50
        });

        const unreadCount = notifications.filter(n => !n.is_read).length;

        res.status(200).json({ success: true, data: notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
    try {
        const did = parseInt(req.params.did);
        const { id } = req.params;

        const notification = await DriverNotification.findOne({ where: { dnid: id, did } });
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

        await notification.update({ is_read: true });
        res.status(200).json({ success: true, message: 'Marked as read', data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notification', error: error.message });
    }
};

// Mark all notifications as read for a driver
exports.markAllAsRead = async (req, res) => {
    try {
        const did = parseInt(req.params.did);
        await DriverNotification.update({ is_read: true }, { where: { did, is_read: false } });
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notifications', error: error.message });
    }
};

// Delete a single notification
exports.deleteNotification = async (req, res) => {
    try {
        const did = parseInt(req.params.did);
        const { id } = req.params;

        const notification = await DriverNotification.findOne({ where: { dnid: id, did } });
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

        await notification.destroy();
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
    }
};

// Clear all notifications for a driver
exports.clearAll = async (req, res) => {
    try {
        const did = parseInt(req.params.did);
        await DriverNotification.destroy({ where: { did } });
        res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to clear notifications', error: error.message });
    }
};

// Internal helper — called from other controllers (not an HTTP handler)
exports.createDriverNotification = async ({ did, type, title, message, reference_id }) => {
    try {
        await DriverNotification.create({ did, type, title, message, reference_id });
    } catch (err) {
        console.error('Failed to create driver notification:', err.message);
    }
};
