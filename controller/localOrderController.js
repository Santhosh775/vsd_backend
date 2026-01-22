const LocalOrder = require('../model/LocalOrder');
const { Order, OrderItem, Stock } = require('../model/associations');
const { sequelize } = require('../config/db');


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
    const transaction = await sequelize.transaction();
    try {
        const { orderId } = req.params;
        const { productAssignments, deliveryRoutes, summaryData } = req.body;
        

        let localOrder = await LocalOrder.findOne({ where: { order_id: orderId }, transaction });
        
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

        // Helper function to check if all assignments are completed
        const checkAllCompleted = (dataToCheck) => {
            if (!dataToCheck || !dataToCheck.driverAssignments || !Array.isArray(dataToCheck.driverAssignments)) {
                return false;
            }
            
            // Collect all assignments from all driver groups
            const allAssignments = [];
            dataToCheck.driverAssignments.forEach(driverGroup => {
                if (driverGroup.assignments && Array.isArray(driverGroup.assignments)) {
                    allAssignments.push(...driverGroup.assignments);
                }
            });
            
            // Check if all assignments have status "Completed" (case-insensitive)
            if (allAssignments.length === 0) {
                return false;
            }
            
            return allAssignments.every(assignment => {
                const status = assignment.status || '';
                return status.toLowerCase() === 'completed';
            });
        };

        // Check existing summary_data in database first, then incoming summaryData
        let allCompleted = false;
        let dataToUseForStock = null;
        
        // First, check if there's existing summary_data in the database
        if (localOrder && localOrder.summary_data) {
            try {
                const existingSummaryData = typeof localOrder.summary_data === 'string'
                    ? JSON.parse(localOrder.summary_data)
                    : localOrder.summary_data;
                
                if (checkAllCompleted(existingSummaryData)) {
                    allCompleted = true;
                    dataToUseForStock = existingSummaryData;
                }
            } catch (e) {
                console.error('Error parsing existing summary_data:', e);
            }
        }
        
        // If existing data is not all completed, check incoming summaryData
        if (!allCompleted && summaryData) {
            if (checkAllCompleted(summaryData)) {
                allCompleted = true;
                dataToUseForStock = summaryData;
            }
        }

        // If all assignments are completed, create or update Stock entries
        if (allCompleted && dataToUseForStock && dataToUseForStock.driverAssignments) {
            // Check if stock entries already exist for this order to avoid duplicates from same order
            const existingStockForOrder = await Stock.findAll({
                where: { order_id: orderId },
                transaction
            });
            
            // Only process stock entries if they don't already exist for this order
            if (existingStockForOrder.length === 0) {
                const today = new Date().toISOString().split('T')[0];
                
                // Group assignments by product and entity to aggregate quantities
                const stockMap = {};
                
                dataToUseForStock.driverAssignments.forEach(driverGroup => {
                    if (driverGroup.assignments && Array.isArray(driverGroup.assignments)) {
                        driverGroup.assignments.forEach(assignment => {
                            // Only process completed assignments
                            if (assignment.status && assignment.status.toLowerCase() === 'completed') {
                                const productName = assignment.product || '';
                                const entityType = assignment.entityType || '';
                                const entityName = assignment.entityName || '';
                                const quantity = parseFloat(assignment.quantity) || 0;
                                
                                if (productName && entityType && entityName && quantity > 0) {
                                    const key = `${productName}-${entityType}-${entityName}`;
                                    
                                    if (!stockMap[key]) {
                                        stockMap[key] = {
                                            order_id: orderId,
                                            date: today,
                                            type: entityType,
                                            name: entityName,
                                            products: productName,
                                            quantity: 0
                                        };
                                    }
                                    
                                    stockMap[key].quantity += quantity;
                                }
                            }
                        });
                    }
                });
                
                // Create or update Stock entries for each unique product-entity combination
                for (const stockEntry of Object.values(stockMap)) {
                    // Check if stock entry exists for same product, type, and name (regardless of order_id)
                    const existingStock = await Stock.findOne({
                        where: {
                            products: stockEntry.products,
                            type: stockEntry.type,
                            name: stockEntry.name
                        },
                        transaction
                    });
                    
                    if (existingStock) {
                        // Update existing stock entry by adding new quantity
                        const newQuantity = parseFloat(existingStock.quantity) + parseFloat(stockEntry.quantity);
                        await existingStock.update({
                            quantity: parseFloat(newQuantity.toFixed(2)),
                            date: today // Update date to today
                        }, { transaction });
                    } else {
                        // Create new stock entry
                        await Stock.create({
                            order_id: stockEntry.order_id,
                            date: stockEntry.date,
                            type: stockEntry.type,
                            name: stockEntry.name,
                            products: stockEntry.products,
                            quantity: parseFloat(stockEntry.quantity.toFixed(2))
                        }, { transaction });
                    }
                }
            }
        }

        // Determine status based on incoming summaryData (what's being saved)
        const incomingAllCompleted = summaryData ? checkAllCompleted(summaryData) : false;
        const finalStatus = incomingAllCompleted ? 'completed' : 'in_progress';

        if (localOrder) {
            await localOrder.update({
                product_assignments: processedAssignments,
                delivery_routes: processedRoutes,
                summary_data: summaryData,
                status: finalStatus
            }, { transaction });
        } else {
            localOrder = await LocalOrder.create({
                order_id: orderId,
                order_type: 'LOCAL GRADE ORDER',
                product_assignments: processedAssignments,
                delivery_routes: processedRoutes,
                summary_data: summaryData,
                status: finalStatus
            }, { transaction });
        }
        
        await transaction.commit();
        
        res.status(200).json({ 
            success: true, 
            message: allCompleted 
                ? 'Local order saved successfully. Stock entries created.' 
                : 'Local order saved successfully', 
            data: localOrder 
        });
    } catch (error) {
        await transaction.rollback();
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
