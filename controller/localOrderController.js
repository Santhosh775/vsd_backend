const LocalOrder = require('../model/LocalOrder');
const { Order, OrderItem } = require('../model/associations');

// Get local order by order ID
const getLocalOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const localOrder = await LocalOrder.findOne({
            where: { order_id: orderId },
            include: [{
                model: Order,
                as: 'order',
                include: [{
                    model: OrderItem,
                    as: 'items'
                }]
            }]
        });
        
        if (!localOrder) {
            const order = await Order.findByPk(orderId, {
                include: [{ model: OrderItem, as: 'items' }]
            });
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            
            return res.status(200).json({
                success: true,
                data: { order: order.toJSON() }
            });
        }
        
        res.status(200).json({
            success: true,
            data: localOrder
        });
    } catch (error) {
        console.error('Error fetching local order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch local order',
            error: error.message
        });
    }
};

// Create or update local order
const saveLocalOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { collectionType, productAssignments, deliveryRoutes, summaryData } = req.body;
        
        if (!collectionType || !['Box', 'Bag'].includes(collectionType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid collection type' 
            });
        }

        let localOrder = await LocalOrder.findOne({ where: { order_id: orderId } });
        
        const processedAssignments = productAssignments.map(pa => ({
            id: pa.id,
            product: pa.product || pa.product_name,
            entityType: pa.entityType,
            entityId: pa.entityId,
            assignedTo: pa.assignedTo,
            assignedQty: parseFloat(pa.assignedQty) || 0,
            assignedBoxes: parseInt(pa.assignedBoxes) || 0,
            price: parseFloat(pa.price) || 0,
            place: pa.place || '',
            tapeColor: pa.tapeColor || ''
        }));

        // Around line 95-105
const processedRoutes = deliveryRoutes.map(route => ({
    routeId: route.routeId,
    sourceId: route.sourceId,
    location: route.location,
    address: route.address,
    product: route.product,
    quantity: parseFloat(route.quantity) || 0,
    assignedBoxes: parseInt(route.assignedBoxes) || 0,
    oiid: route.oiid,
    entityType: route.entityType,
    entityId: route.entityId,
    driver: route.driver || '',
    labour: route.labour || '',      // Old format (string)
    labours: route.labours || [],    // NEW: Add this line for new format (array)
    isRemaining: route.isRemaining || false
}));

        if (localOrder) {
            await localOrder.update({
                collection_type: collectionType,
                product_assignments: processedAssignments,
                delivery_routes: processedRoutes,
                summary_data: summaryData,
                status: 'completed'
            });
        } else {
            localOrder = await LocalOrder.create({
                order_id: orderId,
                order_type: 'Local Grade',
                collection_type: collectionType,
                product_assignments: processedAssignments,
                delivery_routes: processedRoutes,
                summary_data: summaryData,
                status: 'completed'
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Local order saved successfully', 
            data: localOrder 
        });
    } catch (error) {
        console.error('Error saving local order:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save local order', 
            error: error.message 
        });
    }
};

// Get all local orders
const getAllLocalOrders = async (req, res) => {
    try {
        const localOrders = await LocalOrder.findAll({
            include: [{
                model: Order,
                as: 'order',
                include: [{ model: OrderItem, as: 'items' }]
            }],
            order: [['created_at', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            data: localOrders
        });
    } catch (error) {
        console.error('Error fetching local orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch local orders',
            error: error.message
        });
    }
};

module.exports = {
    getLocalOrder,
    saveLocalOrder,
    getAllLocalOrders
};
