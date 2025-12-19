const PreOrder = require('../model/preOrderModel');
const { Op } = require('sequelize');

// Create or update pre-order
exports.createOrUpdatePreOrder = async (req, res) => {
    try {
        const { order_id, collection_type, product_assignments, delivery_routes, summary_data } = req.body;

        const existingPreOrder = await PreOrder.findOne({ where: { order_id } });

        if (existingPreOrder) {
            await existingPreOrder.update({
                collection_type,
                product_assignments,
                delivery_routes,
                summary_data
            });

            return res.status(200).json({
                success: true,
                message: 'Pre-order updated successfully',
                data: existingPreOrder
            });
        } else {
            const preOrder = await PreOrder.create({
                order_id,
                collection_type,
                product_assignments,
                delivery_routes,
                summary_data
            });

            return res.status(201).json({
                success: true,
                message: 'Pre-order created successfully',
                data: preOrder
            });
        }
    } catch (error) {
        console.error('Error creating/updating pre-order:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating/updating pre-order',
            error: error.message
        });
    }
};

// Get pre-order by order ID
exports.getPreOrderByOrderId = async (req, res) => {
    try {
        const { order_id } = req.params;

        const preOrder = await PreOrder.findOne({ where: { order_id } });

        if (!preOrder) {
            return res.status(404).json({
                success: false,
                message: 'Pre-order not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: preOrder
        });
    } catch (error) {
        console.error('Error fetching pre-order:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching pre-order',
            error: error.message
        });
    }
};

// Get all pre-orders
exports.getAllPreOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const whereClause = status ? { status } : {};

        const preOrders = await PreOrder.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: preOrders
        });
    } catch (error) {
        console.error('Error fetching pre-orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching pre-orders',
            error: error.message
        });
    }
};

// Update pre-order status
exports.updatePreOrderStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { status } = req.body;

        const preOrder = await PreOrder.findOne({ where: { order_id } });

        if (!preOrder) {
            return res.status(404).json({
                success: false,
                message: 'Pre-order not found'
            });
        }

        await preOrder.update({ status });

        return res.status(200).json({
            success: true,
            message: 'Pre-order status updated successfully',
            data: preOrder
        });
    } catch (error) {
        console.error('Error updating pre-order status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating pre-order status',
            error: error.message
        });
    }
};

// Delete pre-order
exports.deletePreOrder = async (req, res) => {
    try {
        const { order_id } = req.params;

        const preOrder = await PreOrder.findOne({ where: { order_id } });

        if (!preOrder) {
            return res.status(404).json({
                success: false,
                message: 'Pre-order not found'
            });
        }

        await preOrder.destroy();

        return res.status(200).json({
            success: true,
            message: 'Pre-order deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting pre-order:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting pre-order',
            error: error.message
        });
    }
};
