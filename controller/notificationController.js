const Notification = require('../model/notificationModel');

// Create a new notification (for current admin)
exports.createNotification = async (req, res) => {
    try {
        const { type, title, message, reference_id } = req.body;

        if (!type || !title) {
            return res.status(400).json({
                success: false,
                message: 'Type and title are required'
            });
        }

        const notification = await Notification.create({
            aid: req.admin?.aid,
            type,
            title,
            message,
            reference_id
        });

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

// Get all notifications for current admin
exports.getNotifications = async (req, res) => {
    try {
        const aid = req.admin?.aid;
        const { type } = req.query;

        const whereClause = { aid };
        if (type) {
            whereClause.type = type;
        }

        const notifications = await Notification.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

// Get a single notification by ID
exports.getNotificationById = async (req, res) => {
    try {
        const aid = req.admin?.aid;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { nid: id, aid }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification',
            error: error.message
        });
    }
};

// Mark a single notification as read
exports.markNotificationAsRead = async (req, res) => {
    try {
        const aid = req.admin?.aid;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { nid: id, aid }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.update({ is_read: true });

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notification',
            error: error.message
        });
    }
};

// Mark all notifications as read for current admin
exports.markAllAsRead = async (req, res) => {
    try {
        const aid = req.admin?.aid;

        await Notification.update(
            { is_read: true },
            { where: { aid, is_read: false } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notifications',
            error: error.message
        });
    }
};

// Delete a single notification
exports.deleteNotification = async (req, res) => {
    try {
        const aid = req.admin?.aid;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { nid: id, aid }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.destroy();

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// Delete all notifications for current admin
exports.clearNotifications = async (req, res) => {
    try {
        const aid = req.admin?.aid;

        await Notification.destroy({ where: { aid } });

        res.status(200).json({
            success: true,
            message: 'All notifications cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear notifications',
            error: error.message
        });
    }
};

