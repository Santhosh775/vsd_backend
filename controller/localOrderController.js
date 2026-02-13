const LocalOrder = require('../model/LocalOrder');
const { Order, OrderItem, Stock, Driver } = require('../model/associations');
const { sequelize } = require('../config/db');

// Check if driverId (did or driver_id) appears in summary_data.driverAssignments
const driverIdInSummaryData = (summaryData, driverDid, driverIdStr) => {
    if (!summaryData?.driverAssignments?.length) return false;
    for (const da of summaryData.driverAssignments) {
        const id = da.driverId;
        if (id === driverDid || id === driverIdStr || String(id) === String(driverDid)) return true;
    }
    return false;
};

// Get orders for a particular driver from LocalOrder table (by stored driverId in summary_data)
const getDriverLocalOrders = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driverByDid = Number(driverId);
        const isNumeric = !Number.isNaN(driverByDid);

        const driver = await Driver.findOne({
            where: isNumeric ? { did: driverByDid } : { driver_id: driverId }
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        const did = driver.did;
        const driverIdStr = String(driver.driver_id || '');

        const localOrders = await LocalOrder.findAll({
            include: [{
                model: Order,
                as: 'order',
                include: [{
                    model: OrderItem,
                    as: 'items',
                    attributes: ['oiid', 'product_name', 'num_boxes', 'packing_type', 'net_weight', 'gross_weight']
                }]
            }],
            order: [['created_at', 'DESC']]
        });

        const result = [];
        for (const lo of localOrders) {
            const plain = lo.get({ plain: true });
            if (driverIdInSummaryData(plain.summary_data, did, driverIdStr)) {
                result.push(plain);
            }
        }

        res.status(200).json({
            success: true,
            data: result,
            count: result.length
        });
    } catch (error) {
        console.error('Error fetching driver local orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver local orders',
            error: error.message
        });
    }
};

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
        const { productAssignments, deliveryRoutes, summaryData: summaryDataRaw } = req.body;
        // Accept camelCase or snake_case from client
        const summaryDataIn = summaryDataRaw ?? req.body.summary_data ?? null;

        // Build summary_data with driverId stored exactly as received (typically driver's driver_id string)
        let summaryDataToStore = summaryDataIn;
        if (summaryDataIn && summaryDataIn.driverAssignments && Array.isArray(summaryDataIn.driverAssignments)) {
            summaryDataToStore = {
                ...summaryDataIn,
                driverAssignments: summaryDataIn.driverAssignments.map(driverGroup => {
                    return {
                        ...driverGroup,
                        // Prefer driverId sent from frontend (based on driver_id), fall back to driver_id,
                        // and store as string so alphanumeric IDs like "DR001" are preserved.
                        driverId: driverGroup.driverId != null
                            ? String(driverGroup.driverId)
                            : (driverGroup.driver_id != null ? String(driverGroup.driver_id) : null)
                    };
                })
            };
        }

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
            tapeColor: pa.tapeColor || '',
            address: pa.address || ''
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
        if (!allCompleted && summaryDataToStore) {
            if (checkAllCompleted(summaryDataToStore)) {
                allCompleted = true;
                dataToUseForStock = summaryDataToStore;
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

                // Create one new Stock entry per completed assignment (do not merge with existing stock by product+entity)
                for (const driverGroup of dataToUseForStock.driverAssignments) {
                    if (driverGroup.assignments && Array.isArray(driverGroup.assignments)) {
                        for (const assignment of driverGroup.assignments) {
                            if (assignment.status && assignment.status.toLowerCase() === 'completed') {
                                const productName = assignment.product || '';
                                const entityType = assignment.entityType || '';
                                const entityName = assignment.entityName || '';
                                const quantity = parseFloat(assignment.quantity) || 0;

                                if (productName && entityType && entityName && quantity > 0) {
                                    // Always create a new stock row; do not find or add to existing
                                    await Stock.create({
                                        order_id: orderId,
                                        date: today,
                                        type: entityType,
                                        name: entityName,
                                        products: productName,
                                        quantity: parseFloat(quantity.toFixed(2)),
                                        // Store system time from this Node server when stock was created
                                        stock_creation_time: new Date()
                                    }, { transaction });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Determine status based on incoming summaryData (what's being saved)
        const incomingAllCompleted = summaryDataToStore ? checkAllCompleted(summaryDataToStore) : false;
        const finalStatus = incomingAllCompleted ? 'completed' : 'in_progress';

        if (localOrder) {
            await localOrder.update({
                product_assignments: processedAssignments,
                delivery_routes: processedRoutes,
                summary_data: summaryDataToStore,
                status: finalStatus
            }, { transaction });
        } else {
            localOrder = await LocalOrder.create({
                order_id: orderId,
                order_type: 'LOCAL GRADE ORDER',
                product_assignments: processedAssignments,
                delivery_routes: processedRoutes,
                summary_data: summaryDataToStore,
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

// Update summary_data status for driver app (local orders)
const updateLocalOrderStatus = async (req, res) => {
    try {
        const { orderId, oiid, driverId } = req.params;
        const { status, dropDriver, collectionStatus } = req.body;

        // Try to find local order by order_id (oid) first, then by order_auto_id
        let localOrder = await LocalOrder.findOne({ where: { order_id: orderId } });
        if (!localOrder) {
            // Try finding by matching the order's order_id field (the auto-generated one like "CUSTOMERNAME_DD-MM-YYYY")
            const order = await Order.findOne({ where: { order_id: orderId } });
            if (order) {
                localOrder = await LocalOrder.findOne({ where: { order_id: order.oid } });
            }
        }
        if (!localOrder || !localOrder.summary_data) {
            return res.status(404).json({ success: false, message: 'Local order not found' });
        }

        const summaryData = localOrder.summary_data;
        let driverIndex = -1;
        let assignmentIndex = -1;

        summaryData.driverAssignments?.forEach((driverGroup, dIdx) => {
            if (String(driverGroup.driverId) === String(driverId)) {
                driverGroup.assignments?.forEach((a, aIdx) => {
                    if (String(a.oiid) === String(oiid)) {
                        driverIndex = dIdx;
                        assignmentIndex = aIdx;
                    }
                });
            }
        });

        if (driverIndex === -1 || assignmentIndex === -1) {
            return res.status(404).json({ success: false, message: 'Assignment not found for this driver' });
        }

        const updateFields = {};
        if (status) updateFields[`summary_data.driverAssignments[${driverIndex}].assignments[${assignmentIndex}].status`] = status;
        if (dropDriver) updateFields[`summary_data.driverAssignments[${driverIndex}].assignments[${assignmentIndex}].dropDriver`] = dropDriver;
        if (collectionStatus) updateFields[`summary_data.driverAssignments[${driverIndex}].assignments[${assignmentIndex}].collectionStatus`] = collectionStatus;

        await localOrder.update(updateFields);
        res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating local order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

module.exports = {
    getLocalOrder,
    saveLocalOrder,
    getAllLocalOrders,
    getDriverLocalOrders,
    updateLocalOrderStatus
};