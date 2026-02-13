const { OrderAssignment, Order, OrderItem, Farmer, Supplier, ThirdParty, Labour, Driver, Stock } = require('../model/associations');
const { sequelize } = require('../config/db');

// Check if an assignment involves the given driver (by did or driver_id)
const assignmentHasDriver = (assignment, driver) => {
    const did = driver.did;
    const driverIdStr = String(driver.driver_id || '');
    const driverName = (driver.driver_name || '').trim();

    if (assignment.airport_driver_id === did) return true;

    const stage1 = assignment.stage1_summary_data;
    if (stage1?.driverAssignments?.length) {
        for (const da of stage1.driverAssignments) {
            if (da.driverId === did || da.driverId === driverIdStr || String(da.driverId) === String(did)) return true;
            if (driverName && (da.driver === driverName || da.driverName === driverName)) return true;
        }
    }

    const routes = assignment.delivery_routes;
    if (Array.isArray(routes)) {
        for (const r of routes) {
            if (r.driverId === did || r.driverId === driverIdStr || String(r.driverId) === String(did)) return true;
            if (driverName && (r.driver === driverName || r.driverName === driverName)) return true;
        }
    }

    const stage3 = assignment.stage3_summary_data;
    if (stage3?.driverAssignments?.length) {
        for (const da of stage3.driverAssignments) {
            if (da.driverId === did || da.driverId === driverIdStr || String(da.driverId) === String(did)) return true;
            if (driverName && (da.driver === driverName || da.driverName === driverName)) return true;
        }
    }

    return false;
};

// Get orders assigned to a specific driver (for driver app)
const getOrdersByDriverId = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driverByDid = Number(driverId);
        const isNumeric = !Number.isNaN(driverByDid);

        const driver = await Driver.findOne({
            where: isNumeric
                ? { did: driverByDid }
                : { driver_id: driverId }
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        const assignments = await OrderAssignment.findAll({
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [{
                        model: OrderItem,
                        as: 'items',
                        attributes: ['oiid', 'product_name', 'num_boxes', 'packing_type', 'net_weight', 'gross_weight']
                    }]
                },
                {
                    model: Driver,
                    as: 'airportDriver',
                    attributes: ['did', 'driver_id', 'driver_name']
                }
            ]
        });

        const driverPlain = driver.get({ plain: true });
        const filtered = assignments.filter(a => assignmentHasDriver(a.get({ plain: true }), driverPlain));

        const data = filtered.map(a => {
            const raw = a.get({ plain: true });
            const assignmentData = { ...raw };
            if (assignmentData.stage2_data?.productAssignments) {
                assignmentData.stage2_assignments = assignmentData.stage2_data.productAssignments;
            }
            return assignmentData;
        });

        res.status(200).json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching orders by driver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders for driver',
            error: error.message
        });
    }
};

// Check if driverId (did or driver_id) appears in stage summary driverAssignments
const driverIdInStageSummary = (stageSummaryData, driverDid, driverIdStr) => {
    if (!stageSummaryData?.driverAssignments?.length) return false;
    for (const da of stageSummaryData.driverAssignments) {
        const id = da.driverId;
        if (id === driverDid || id === driverIdStr || String(id) === String(driverDid)) return true;
    }
    return false;
};

// Get orders for a particular driver from stage1_summary_data and stage3_summary_data only (by stored driverId)
const getDriverOrdersFromStage1AndStage3 = async (req, res) => {
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

        const assignments = await OrderAssignment.findAll({
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [{
                        model: OrderItem,
                        as: 'items',
                        attributes: ['oiid', 'product_name', 'num_boxes', 'packing_type', 'net_weight', 'gross_weight']
                    }]
                },
                {
                    model: Driver,
                    as: 'airportDriver',
                    attributes: ['did', 'driver_id', 'driver_name']
                }
            ]
        });

        const result = [];
        for (const a of assignments) {
            const plain = a.get({ plain: true });
            const inStage1 = driverIdInStageSummary(plain.stage1_summary_data, did, driverIdStr);
            const inStage3 = driverIdInStageSummary(plain.stage3_summary_data, did, driverIdStr);

            if (inStage1 || inStage3) {
                const assignmentData = { ...plain };
                if (assignmentData.stage2_data?.productAssignments) {
                    assignmentData.stage2_assignments = assignmentData.stage2_data.productAssignments;
                }
                result.push({
                    ...assignmentData,
                    inStage1,
                    inStage3
                });
            }
        }

        res.status(200).json({
            success: true,
            data: result,
            count: result.length
        });
    } catch (error) {
        console.error('Error fetching driver orders from stage1/stage3:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver orders',
            error: error.message
        });
    }
};

// Get order assignment by order ID
const getOrderAssignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const assignment = await OrderAssignment.findOne({
            where: { order_id: orderId },
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [{
                        model: OrderItem,
                        as: 'items',
                        attributes: ['oiid', 'product_name', 'num_boxes', 'packing_type', 'net_weight', 'gross_weight']
                    }]
                },
                {
                    model: Driver,
                    as: 'airportDriver',
                    attributes: ['did', 'driver_id', 'driver_name']
                }
            ]
        });
        
        if (!assignment) {
            // Get order to check its type
            const order = await Order.findByPk(orderId, {
                include: [{
                    model: OrderItem,
                    as: 'items'
                }]
            });
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            
            // Check if this is a local order - local orders should NOT use OrderAssignment
            const orderType = order.order_type?.toLowerCase();
            if (orderType === 'local' || orderType === 'local grade order') {
                return res.status(404).json({
                    success: false,
                    message: 'This is a local order. Please use the local order assignment endpoint instead.'
                });
            }
            // Flower orders use flower-order-assignment endpoint and flower_order_assignments table
            if (orderType === 'flower order' || orderType === 'flower') {
                return res.status(400).json({
                    success: false,
                    message: 'This is a flower order. Please use the flower order assignment endpoint: /api/v1/flower-order-assignment/:orderId'
                });
            }
            
            // Only create OrderAssignment for flight/box orders
            const newAssignment = await OrderAssignment.create({
                order_id: orderId,
                order_auto_id: order.order_id
            });
            
            return res.status(200).json({
                success: true,
                data: {
                    ...newAssignment.toJSON(),
                    order: order.toJSON()
                }
            });
        }
        
        // Add compatibility layer for frontend
        const assignmentData = assignment.toJSON();
        
        // Extract stage2_assignments from stage2_data for backward compatibility
        if (assignmentData.stage2_data?.productAssignments) {
            assignmentData.stage2_assignments = assignmentData.stage2_data.productAssignments;
        }
        
        res.status(200).json({
            success: true,
            data: assignmentData
        });
    } catch (error) {
        console.error('Error fetching order assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order assignment',
            error: error.message
        });
    }
};

// Update order assignment (Stage 1) - Store form data and summary from frontend
const updateStage1Assignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderType, productAssignments, deliveryRoutes, summaryData } = req.body;

        // Check if this is a local order - local orders should NOT use OrderAssignment
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        const orderTypeFromDB = order.order_type?.toLowerCase();
        if (orderTypeFromDB === 'local' || orderTypeFromDB === 'local grade order') {
            return res.status(400).json({
                success: false,
                message: 'This is a local order. Please use the local order assignment endpoint instead.'
            });
        }
        if (orderTypeFromDB === 'flower order' || orderTypeFromDB === 'flower') {
            return res.status(400).json({
                success: false,
                message: 'This is a flower order. Please use the flower order assignment endpoint: /api/v1/flower-order-assignment/:orderId'
            });
        }

        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            assignment = await OrderAssignment.create({ 
                order_id: orderId,
                order_auto_id: order?.order_id
            });
        }
        
        // Process product assignments with entity details
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

        // Process delivery routes with driver and labour info
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
            labour: route.labour || '',
            isRemaining: route.isRemaining || false
        }));

        // Determine stage1_status based on assignment completion
        let stage1Status = 'pending'; // Default status

        // Build stage1_summary_data with driverId stored exactly as received from frontend
        let stage1SummaryData = summaryData || null;
        if (summaryData && summaryData.driverAssignments && Array.isArray(summaryData.driverAssignments)) {
            stage1SummaryData = {
                ...summaryData,
                driverAssignments: summaryData.driverAssignments.map(driverGroup => {
                    return {
                        ...driverGroup,
                        // Store the identifier as-is (usually the driver's driver_id string).
                        // This avoids coercing alphanumeric driver IDs (e.g. "DR001") into numbers.
                        driverId: driverGroup.driverId != null ? String(driverGroup.driverId) : null
                    };
                })
            };

            // Collect all assignments from all driver groups
            const allAssignments = [];
            summaryData.driverAssignments.forEach(driverGroup => {
                if (driverGroup.assignments && Array.isArray(driverGroup.assignments)) {
                    allAssignments.push(...driverGroup.assignments);
                }
            });

            // Check if all assignments have status "Completed"
            if (allAssignments.length > 0) {
                const allCompleted = allAssignments.every(assignment => {
                    const status = assignment.status || '';
                    return status.toLowerCase() === 'completed';
                });

                if (allCompleted) {
                    stage1Status = 'completed';
                }
            }
        }

        // Update assignment
        await assignment.update({
            order_type: orderType,
            product_assignments: processedAssignments,
            delivery_routes: processedRoutes,
            stage1_summary_data: stage1SummaryData,
            stage1_status: stage1Status
        });
        
        res.status(200).json({ success: true, message: 'Stage 1 saved successfully', data: assignment });
    } catch (error) {
        console.error('Error updating stage 1:', error);
        res.status(500).json({ success: false, message: 'Failed to update stage 1', error: error.message });
    }
};

// Update order assignment (Stage 2) - With labour, wastage, and reuse tracking
const updateStage2Assignment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { orderId } = req.params;
        const { productAssignments, summaryData } = req.body;
        
        if (!productAssignments || !Array.isArray(productAssignments)) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Product assignments are required' });
        }

        // Check if this is a local order - local orders should NOT use OrderAssignment
        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'items' }],
            transaction
        });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        const orderTypeFromDB = order.order_type?.toLowerCase();
        if (orderTypeFromDB === 'local' || orderTypeFromDB === 'local grade order') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'This is a local order. Please use the local order assignment endpoint instead.'
            });
        }
        if (orderTypeFromDB === 'flower order' || orderTypeFromDB === 'flower') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'This is a flower order. Please use the flower order assignment endpoint: /api/v1/flower-order-assignment/:orderId'
            });
        }

        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId }, transaction });
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId,
                order_auto_id: order?.order_id
            }, { transaction });
        }

        const productGroups = {};
        productAssignments.forEach(pa => {
            const oiid = pa.id;
            if (!productGroups[oiid]) {
                productGroups[oiid] = {
                    product: pa.product,
                    vendors: [],
                    reuse: parseFloat(pa.reuse) || 0
                };
            }
            productGroups[oiid].vendors.push(pa);
        });

        for (const [oiid, group] of Object.entries(productGroups)) {
            const orderItem = order.items.find(item => item.oiid == oiid);
            if (!orderItem) continue;
            
            const quantityNeeded = parseFloat(orderItem.net_weight) || 0;
            const totalPacked = group.vendors.reduce((sum, v) => sum + (parseFloat(v.packedAmount) || 0), 0);
            const totalPacking = totalPacked + group.reuse;
            
            if (totalPacking > quantityNeeded) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Total packing (${totalPacking.toFixed(2)} kg) exceeds quantity needed (${quantityNeeded.toFixed(2)} kg) for product: ${group.product}`
                });
            }
        }

        const stage2Assignments = [];
        const today = new Date().toISOString().split('T')[0];

        // Previous reuse per product (from last save) - on edit only deduct/add the delta
        let previousReuseByOiid = {};
        if (assignment.stage2_data) {
            try {
                const prevStage2 = typeof assignment.stage2_data === 'string'
                    ? JSON.parse(assignment.stage2_data)
                    : assignment.stage2_data;
                const prevAssignments = prevStage2?.productAssignments || [];
                prevAssignments.forEach(pa => {
                    const id = String(pa.id);
                    const reuse = parseFloat(pa.reuse) || 0;
                    previousReuseByOiid[id] = Math.max(previousReuseByOiid[id] || 0, reuse);
                });
            } catch (e) {
                // ignore parse errors; treat as no previous data
            }
        }

        const processedReuse = {};
        for (const [oiid, group] of Object.entries(productGroups)) {
            const newReuse = group.reuse;
            const previousReuse = previousReuseByOiid[oiid] || 0;
            const deltaReuse = newReuse - previousReuse;
            const productName = group.product;
            let reuseFromStock = 0;

            if (deltaReuse > 0) {
                // Need more from stock: deduct only the increase (old stock first)
                const stocks = await Stock.findAll({
                    where: { products: productName },
                    order: [[sequelize.literal('COALESCE(stock_creation_time, created_at)'), 'ASC']],
                    transaction
                });

                let reuseRemaining = deltaReuse;
                for (const stock of stocks) {
                    if (reuseRemaining <= 0) break;
                    const stockQty = parseFloat(stock.quantity) || 0;
                    if (stockQty > 0) {
                        const deduction = Math.min(stockQty, reuseRemaining);
                        reuseFromStock += deduction;
                        reuseRemaining -= deduction;
                        const newQty = stockQty - deduction;
                        
                        if (newQty <= 0) {
                            await stock.destroy({ transaction });
                        } else {
                            await stock.update({ quantity: newQty }, { transaction });
                        }
                    }
                }
            } else if (deltaReuse < 0) {
                // Reuse reduced: return the difference to stock (new row, consumed last by FIFO)
                const amountToReturn = Math.abs(deltaReuse);
                if (amountToReturn > 0.001) {
                    await Stock.create({
                        order_id: orderId,
                        date: today,
                        type: 'Reuse',
                        name: 'Stage2 Return',
                        products: productName,
                        quantity: parseFloat(amountToReturn.toFixed(2)),
                        stock_creation_time: new Date()
                    }, { transaction });
                }
            }
            processedReuse[oiid] = reuseFromStock;
        }

        // Update in place: match existing stock rows for this order to current assignments; update quantity or create/delete only as needed (no blanket destroy so kg don't vanish).
        const existingStocks = await Stock.findAll({
            where: { order_id: orderId },
            transaction
        });
        const usedStockIds = new Set();

        for (const pa of productAssignments) {
            // Use pickedWeight (kg) when pickedQuantity is 0/missing (e.g. box-based orders send weight separately)
            const pickedQty = parseFloat(pa.pickedQuantity) || parseFloat(pa.pickedWeight) || 0;
            const wastage = parseFloat(pa.wastage) || 0;
            const revisedPicked = pickedQty - wastage;
            const packedAmount = parseFloat(pa.packedAmount) || 0;
            const productName = pa.product;
            const remainingStock = revisedPicked - packedAmount;

            const existing = existingStocks.find(
                s => !usedStockIds.has(s.stock_id) && s.products === productName && s.type === pa.entityType && s.name === pa.entityName
            );
            if (existing) {
                usedStockIds.add(existing.stock_id);
                if (remainingStock > 0.01) {
                    await existing.update({
                        quantity: parseFloat(remainingStock.toFixed(2)),
                        date: today,
                        stock_creation_time: new Date()
                    }, { transaction });
                } else {
                    await existing.destroy({ transaction });
                }
            } else {
                if (remainingStock > 0.01) {
                    await Stock.create({
                        order_id: orderId,
                        date: today,
                        type: pa.entityType,
                        name: pa.entityName,
                        products: productName,
                        quantity: parseFloat(remainingStock.toFixed(2)),
                        stock_creation_time: new Date()
                    }, { transaction });
                }
            }

            stage2Assignments.push({
                id: pa.id,
                product: productName,
                entityType: pa.entityType,
                entityName: pa.entityName,
                pickedQuantity: pickedQty,
                wastage,
                revisedPicked,
                packedAmount,
                remainingStock,
                reuseFromStock: processedReuse[pa.id] || 0,
                labourId: pa.labourId,
                labourName: pa.labourName,
                labourData: pa.labourData || {},
                status: pa.status || 'pending',
                startTime: pa.startTime || '',
                endTime: pa.endTime || ''
            });
        }

        // Remove existing stock rows for this order that no longer have a matching assignment
        for (const s of existingStocks) {
            if (!usedStockIds.has(s.stock_id)) {
                await s.destroy({ transaction });
            }
        }

        let stage2Summary = null;
        if (summaryData) {
            stage2Summary = {
                assignment_id: assignment.assignment_id,
                labourAssignments: summaryData.labourAssignments?.map(la => ({
                    labour: la.labour,
                    labourId: la.labourId,
                    totalPicked: la.totalPicked,
                    totalWastage: la.totalWastage,
                    totalReuse: la.totalReuse,
                    assignments: la.assignments?.map(a => ({
                        product: a.product,
                        entityType: a.entityType,
                        entityName: a.entityName,
                        pickedQuantity: a.pickedQuantity,
                        wastage: a.wastage,
                        reuse: a.reuse,
                        packedAmount: a.packedAmount,
                        status: a.status,
                        startTime: a.startTime,
                        endTime: a.endTime,
                        packedBoxes: a.packedBoxes || 0,
                        oiid: a.oiid
                    }))
                })),
                labourPrices: summaryData.labourPrices || [],
                totalLabours: summaryData.totalLabours,
                totalProducts: summaryData.totalProducts,
                totalPicked: summaryData.totalPicked,
                totalWastage: summaryData.totalWastage,
                totalReuse: summaryData.totalReuse,
                savedAt: new Date().toISOString()
            };
        }

        // Determine stage2_status based on assignment completion
        let stage2Status = 'pending'; // Default status
        
        if (summaryData && summaryData.labourAssignments && Array.isArray(summaryData.labourAssignments)) {
            // Collect all assignments from all labour groups
            const allAssignments = [];
            summaryData.labourAssignments.forEach(labourGroup => {
                if (labourGroup.assignments && Array.isArray(labourGroup.assignments)) {
                    allAssignments.push(...labourGroup.assignments);
                }
            });
            
            // Check if all assignments have status "Completed"
            if (allAssignments.length > 0) {
                const allCompleted = allAssignments.every(assignment => {
                    const status = assignment.status || '';
                    return status.toLowerCase() === 'completed';
                });
                
                if (allCompleted) {
                    stage2Status = 'completed';
                }
            }
        }

        await assignment.update({
            stage2_data: {
                productAssignments: productAssignments.map(pa => {
                    // Use pickedWeight when pickedQuantity is 0/missing (box-based orders)
                    const pickedQty = parseFloat(pa.pickedQuantity) || parseFloat(pa.pickedWeight) || 0;
                    const wastage = parseFloat(pa.wastage) || 0;
                    const revisedPicked = pickedQty - wastage;
                    return {
                        id: pa.id,
                        product: pa.product,
                        entityType: pa.entityType,
                        entityName: pa.entityName,
                        pickedQuantity: pickedQty,
                        wastage: wastage,
                        revisedPicked: revisedPicked,
                        packedAmount: parseFloat(pa.packedAmount) || 0,
                        reuse: parseFloat(pa.reuse) || 0,
                        labourId: pa.labourId || '',
                        labourName: pa.labourName || '',
                        labourData: pa.labourData || {},
                        status: pa.status || 'pending',
                        startTime: pa.startTime || '',
                        endTime: pa.endTime || ''
                    };
                }),
                stage2Assignments: stage2Assignments,
                completedAt: new Date()
            },
            stage2_summary_data: stage2Summary,
            stage2_status: stage2Status
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Stage 2 completed. Stock updated successfully.',
            data: { 
                assignment, 
                summary: stage2Summary,
                stage2Assignments
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Stage 2 Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update stage 2', 
            error: error.message,
            details: error.stack
        });
    }
};

// Helper: normalize airport tape data to array of tape entries per airport
// Supports: { [airport]: { tapeName, tapeQuantity, tapeColor } } or { [airport]: [ { tapeName, tapeQuantity, tapeColor }, ... ] }
function normalizeAirportTapesToArray(airportTapeData) {
    if (!airportTapeData || typeof airportTapeData !== 'object') return {};
    const result = {};
    Object.entries(airportTapeData).forEach(([airport, val]) => {
        if (Array.isArray(val) && val.length > 0) {
            result[airport] = val.map(t => ({
                tapeName: t.tapeName ?? '',
                tapeQuantity: t.tapeQuantity != null ? t.tapeQuantity : '',
                tapeColor: t.tapeColor ?? ''
            }));
        } else if (val && typeof val === 'object' && !Array.isArray(val)) {
            result[airport] = [{ tapeName: val.tapeName ?? '', tapeQuantity: val.tapeQuantity != null ? val.tapeQuantity : '', tapeColor: val.tapeColor ?? '' }];
        } else {
            result[airport] = [];
        }
    });
    return result;
}

// Helper: iterate all tape entries (single or multiple per airport) and call fn(tapeEntry)
function forEachTapeEntry(airportTapeData, fn) {
    const normalized = normalizeAirportTapesToArray(airportTapeData);
    Object.values(normalized).forEach(tapesArray => {
        (tapesArray || []).forEach(entry => {
            if (entry && (entry.tapeColor || entry.tapeName) && entry.tapeQuantity != null && entry.tapeQuantity !== '') {
                fn(entry);
            }
        });
    });
}

// Update order assignment (Stage 3)
const updateStage3Assignment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { orderId } = req.params;
        const { products, summaryData, airportTapeData, isEdit: isEditFromBody } = req.body;
        
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                message: 'Products are required'
            });
        }
        
        // Check if this is a local order - local orders should NOT use OrderAssignment
        const order = await Order.findByPk(orderId, { transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        const orderTypeFromDB = order.order_type?.toLowerCase();
        if (orderTypeFromDB === 'local' || orderTypeFromDB === 'local grade order') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'This is a local order. Please use the local order assignment endpoint instead.'
            });
        }
        if (orderTypeFromDB === 'flower order' || orderTypeFromDB === 'flower') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'This is a flower order. Please use the flower order assignment endpoint: /api/v1/flower-order-assignment/:orderId'
            });
        }

        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId },
            transaction
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId,
                order_auto_id: order?.order_id
            }, { transaction });
        }

        // Treat any existing stage3_data OR an explicit isEdit flag from the frontend as "edit mode".
        // In edit mode we will *not* touch tape inventory again to avoid double‑deduction.
        const hasExistingStage3 = !!assignment.stage3_data;
        const isEdit = !!isEditFromBody || hasExistingStage3;

        // Ensure we always treat existing stage3_data as an object (it may be stored as JSON or string)
        let existingStage3Data = {};
        if (assignment.stage3_data) {
            try {
                existingStage3Data = typeof assignment.stage3_data === 'string'
                    ? JSON.parse(assignment.stage3_data)
                    : assignment.stage3_data;
            } catch (e) {
                console.error('Error parsing existing stage3_data:', e);
                existingStage3Data = {};
            }
        }
        
        // Only update tape inventory when this is NOT an edit operation.
        // This prevents tape quantity from being reduced multiple times when
        // the Stage 3 form is saved repeatedly in edit mode.
        if (!isEdit) {
            // Calculate tape usage for first-time save
            // Frontend sends both tapeColor (color) and tapeName (name) separately
            const tapeUsageMap = {};

            // Prefer airport-level tape data (supports multiple tapes per airport)
            if (airportTapeData) {
                forEachTapeEntry(airportTapeData, (info) => {
                    const key = (info.tapeName || info.tapeColor || '').toString().trim();
                    const qty = parseFloat(info.tapeQuantity) || 0;
                    if (key && qty > 0) {
                        tapeUsageMap[key] = (tapeUsageMap[key] || 0) + qty;
                    }
                });
            }

            // Fallback: aggregate from individual products if airportTapeData is missing
            if (Object.keys(tapeUsageMap).length === 0) {
                products.forEach(p => {
                    const key = (p.tapeName || p.tapeColor || '').toString().trim();
                    if (key && p.tapeQuantity != null && p.tapeQuantity !== '') {
                        const qty = parseFloat(p.tapeQuantity) || 0;
                        if (qty > 0) {
                            tapeUsageMap[key] = (tapeUsageMap[key] || 0) + qty;
                        }
                    }
                });
            }

            // Update tape inventory based on computed usage
            const { Inventory } = require('../model/associations');

            for (const [tapeKey, quantityChange] of Object.entries(tapeUsageMap)) {
                if (!tapeKey || quantityChange === 0) continue;

                // Look up tape by name first (matches frontend dropdown), then by color
                let tape = await Inventory.findOne({
                    where: { category: 'Tape', name: tapeKey },
                    transaction
                });
                if (!tape) {
                    tape = await Inventory.findOne({
                        where: { category: 'Tape', color: tapeKey },
                        transaction
                    });
                }

                if (!tape) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Tape "${tapeKey}" not found in inventory (looked up by name and color)`
                    });
                }

                const currentQty = parseFloat(tape.quantity) || 0;
                const newQuantity = currentQty - quantityChange;
                if (newQuantity < 0) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient tape inventory for "${tapeKey}". Available: ${tape.quantity}, Required: ${quantityChange}`
                    });
                }

                await tape.update({ quantity: newQuantity }, { transaction });
            }
        }
        
        let stage3Summary = null;
        if (summaryData) {
            // Normalize airport tape data to array of tapes per airport (supports multiple tapes per airport)
            const normalizedAirportTapes = normalizeAirportTapesToArray(airportTapeData);
            // Merge tape information into airportGroups: each group gets tapes[] and backward-compat first tape fields
            let airportGroupsWithTape = summaryData.airportGroups || {};
            if (summaryData.airportGroups) {
                airportGroupsWithTape = Object.fromEntries(
                    Object.entries(summaryData.airportGroups).map(([code, group]) => {
                        const airportName = group.airportName;
                        const tapesArray = (airportName && normalizedAirportTapes[airportName]) || [];
                        const firstTape = Array.isArray(tapesArray) && tapesArray.length > 0 ? tapesArray[0] : {};
                        return [code, {
                            ...group,
                            // Multiple tapes per airport (stored in stage3_summary_data)
                            tapes: Array.isArray(tapesArray) ? tapesArray : [firstTape],
                            // Backward compatibility: first tape as single tapeName/tapeQuantity/tapeColor
                            tapeName: firstTape.tapeName ?? group.tapeName ?? '',
                            tapeQuantity: firstTape.tapeQuantity != null ? firstTape.tapeQuantity : (group.tapeQuantity ?? ''),
                            tapeColor: firstTape.tapeColor ?? group.tapeColor ?? ''
                        }];
                    })
                );
            }

            stage3Summary = {
                assignment_id: assignment.assignment_id,
                driverAssignments: summaryData.driverAssignments?.map(da => ({
                    driver: da.driver,
                    // Persist driverId exactly as provided by frontend (typically driver_id),
                    // without numeric coercion so alphanumeric IDs remain intact.
                    driverId: da.driverId != null ? String(da.driverId) : null,
                    vehicleNumber: da.vehicleNumber || '',
                    phoneNumber: da.phoneNumber || '',
                    totalPackages: da.totalPackages || 0,
                    totalWeight: da.totalWeight || 0,
                    assignments: da.assignments?.map(a => ({
                        product: a.product,
                        grossWeight: a.grossWeight,
                        labour: a.labour,
                        ct: a.ct,
                        noOfPkgs: a.noOfPkgs || 0,
                        tapeName: a.tapeName || '',
                        tapeColor: a.tapeColor || '',
                        tapeQuantity: a.tapeQuantity || '',
                        airportName: a.airportName || '',
                        airportLocation: a.airportLocation || '',
                        status: a.status || 'pending',
                        oiid: a.oiid
                    }))
                })),
                // Persist airport-level tape info: tapes array per airport in each group and as separate map
                airportGroups: airportGroupsWithTape,
                airportTapeData: normalizedAirportTapes, // { [airportName]: [ { tapeName, tapeQuantity, tapeColor }, ... ] }
                totalProducts: summaryData.totalProducts || 0,
                totalDrivers: summaryData.totalDrivers || 0,
                totalPackages: summaryData.totalPackages || 0,
                totalWeight: summaryData.totalWeight || 0,
                savedAt: new Date().toISOString()
            };
        }

        // Determine stage3_status based on assignment completion
        let stage3Status = 'in_progress'; // Default status
        
        if (summaryData && summaryData.driverAssignments && Array.isArray(summaryData.driverAssignments)) {
            // Collect all assignments from all driver groups
            const allAssignments = [];
            summaryData.driverAssignments.forEach(driverGroup => {
                if (driverGroup.assignments && Array.isArray(driverGroup.assignments)) {
                    allAssignments.push(...driverGroup.assignments);
                }
            });
            
            // Check if all assignments have status "Completed"
            if (allAssignments.length > 0) {
                const allCompleted = allAssignments.every(assignment => {
                    const status = assignment.status || '';
                    return status.toLowerCase() === 'completed';
                });
                
                if (allCompleted) {
                    stage3Status = 'completed';
                }
            }
        }
        
        // Normalize airport tape data for storage (array of tapes per airport)
        const normalizedForStorage = normalizeAirportTapesToArray(airportTapeData);

        await assignment.update({
            stage3_data: {
                products: products.map(p => ({
                    id: p.id,
                    oiid: p.oiid,
                    product: p.product,
                    grossWeight: p.grossWeight,
                    totalBoxes: p.totalBoxes || 0,
                    labour: p.labour || '-',
                    ct: p.ct || '',
                    noOfPkgs: p.noOfPkgs || '',
                    tapeName: p.tapeName || '',
                    tapeColor: p.tapeColor || '',
                    tapeQuantity: p.tapeQuantity || '',
                    selectedDriver: p.selectedDriver || '',
                    airportName: p.airportName || '',
                    airportLocation: p.airportLocation || '',
                    vehicleNumber: p.vehicleNumber || '',
                    phoneNumber: p.phoneNumber || '',
                    vehicleCapacity: p.vehicleCapacity || '',
                    status: p.status || 'pending',
                    assignmentIndex: p.assignmentIndex || 0
                })),
                // Store airportTapeData as { [airportName]: [ { tapeName, tapeQuantity, tapeColor }, ... ] } for multiple tapes per airport
                airportTapeData: normalizedForStorage
            },
            stage3_summary_data: stage3Summary,
            stage3_status: stage3Status
        }, { transaction });
        
        await transaction.commit();
        
        res.status(200).json({
            success: true,
            message: 'Stage 3 assignment updated successfully',
            data: {
                assignment,
                summary: stage3Summary
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating stage 3 assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stage 3 assignment',
            error: error.message
        });
    }
};

// Update order assignment (Stage 4) - Review
const updateStage4Assignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const stage4Data = req.body;
        
        // Validate market prices
        if (stage4Data.reviewData?.productRows) {
            const invalidPrices = stage4Data.reviewData.productRows.filter(row => 
                !row.marketPrice || row.marketPrice === 0
            );
            
            if (invalidPrices.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot submit Stage 4: Market prices are not updated for some products. Please update product prices before proceeding.',
                    invalidProducts: invalidPrices.map(p => p.product_name || p.product)
                });
            }
        }
        
        const order = await Order.findByPk(orderId);
        if (order) {
            const orderTypeFromDB = order.order_type?.toLowerCase();
            if (orderTypeFromDB === 'flower order' || orderTypeFromDB === 'flower') {
                return res.status(400).json({
                    success: false,
                    message: 'This is a flower order. Please use the flower order assignment endpoint: /api/v1/flower-order-assignment/:orderId'
                });
            }
        }

        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId } });
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Order assignment not found'
            });
        }
        
        await assignment.update({
            stage4_data: {
                ...stage4Data,
                completedAt: new Date()
            },
            stage4_status: 'completed'
        });
        
        res.status(200).json({
            success: true,
            message: 'Stage 4 review data saved successfully',
            data: assignment
        });
    } catch (error) {
        console.error('Error updating stage 4:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stage 4',
            error: error.message
        });
    }
};

// Save individual form entry assignment
const saveItemAssignmentUpdate = async (req, res) => {
    try {
        const { orderId, oiid } = req.params;
        const assignmentData = req.body;
        
        // Check if this is a local order - local orders should NOT use OrderAssignment
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        const orderTypeFromDB = order.order_type?.toLowerCase();
        if (orderTypeFromDB === 'local' || orderTypeFromDB === 'local grade order') {
            return res.status(400).json({
                success: false,
                message: 'This is a local order. Please use the local order assignment endpoint instead.'
            });
        }

        // Find or create assignment
        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId,
                order_auto_id: order?.order_id,
                product_assignments: [assignmentData]
            });
        } else {
            // Update existing product assignments
            let productAssignments = assignment.product_assignments || [];
            const existingIndex = productAssignments.findIndex(a => a.id === assignmentData.id);
            
            if (existingIndex >= 0) {
                productAssignments[existingIndex] = assignmentData;
            } else {
                productAssignments.push(assignmentData);
            }
            
            await assignment.update({
                product_assignments: productAssignments
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Assignment saved successfully',
            data: assignmentData
        });
    } catch (error) {
        console.error('Error saving assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save assignment',
            error: error.message
        });
    }
};

// Get form-based assignments
const getItemAssignments = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Order assignment not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                product_assignments: assignment.product_assignments || [],
                item_assignments: assignment.item_assignments || {}, // Keep for backward compatibility
                stage1_summary_data: assignment.stage1_summary_data || null
            }
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignments',
            error: error.message
        });
    }
};

// Get all farmers, suppliers, third parties, labours, and drivers for dropdowns
const getAssignmentOptions = async (req, res) => {
    try {
        // Get all active farmers
        const farmers = await Farmer.findAll({
            where: { status: 'active' },
            attributes: ['fid', 'farmer_name', 'address', 'city', 'state', 'pin_code', 'tape_color', 'available_stock']
        });
        
        // Get all active suppliers
        const suppliers = await Supplier.findAll({
            where: { status: 'active' },
            attributes: ['sid', 'supplier_name', 'address', 'city', 'state', 'pin_code', 'tape_color', 'available_stock']
        });
        
        // Get all active third parties
        const thirdParties = await ThirdParty.findAll({
            where: { status: 'active' },
            attributes: ['tpid', 'third_party_name', 'address', 'city', 'state', 'pin_code', 'tape_color', 'available_stock']
        });
        
        // Get all active labours
        const labours = await Labour.findAll({
            where: { status: 'Active' },
            attributes: ['lid', 'full_name']
        });
        
        // Get all available drivers
        const drivers = await Driver.findAll({
            where: { status: 'Available' },
            attributes: ['did', 'driver_id', 'driver_name', 'phone_number', 'vehicle_number']
        });
        
        res.status(200).json({
            success: true,
            data: {
                farmers: farmers.map(f => ({
                    id: f.fid,
                    name: f.farmer_name,
                    type: 'farmer',
                    ...f.toJSON()
                })),
                suppliers: suppliers.map(s => ({
                    id: s.sid,
                    name: s.supplier_name,
                    type: 'supplier',
                    ...s.toJSON()
                })),
                thirdParties: thirdParties.map(tp => ({
                    id: tp.tpid,
                    name: tp.third_party_name,
                    type: 'thirdParty',
                    ...tp.toJSON()
                })),
                labours: labours.map(l => ({
                    id: l.lid,
                    name: l.full_name
                })),
                drivers: drivers.map(d => ({
                    id: d.did,
                    driverId: d.driver_id,
                    name: d.driver_name,
                    ...d.toJSON()
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching assignment options:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignment options',
            error: error.message
        });
    }
};

// Get all stock data
const getAllStock = async (req, res) => {
    try {
        const stocks = await Stock.findAll({
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            data: stocks
        });
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock data',
            error: error.message
        });
    }
};

// Get available stock grouped by product
const getAvailableStockByProduct = async (req, res) => {
    try {
        const stocks = await Stock.findAll({
            attributes: [
                'products',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
            ],
            group: ['products'],
            raw: true
        });
        
        // Format the response as a map for easier lookup
        const stockMap = {};
        stocks.forEach(stock => {
            stockMap[stock.products] = parseFloat(stock.total_quantity) || 0;
        });
        
        res.status(200).json({
            success: true,
            data: stockMap
        });
    } catch (error) {
        console.error('Error fetching available stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available stock',
            error: error.message
        });
    }
};

// Get available stock for a specific product
const getProductStock = async (req, res) => {
    try {
        const { productName } = req.params;
        
        const stocks = await Stock.findAll({
            where: {
                products: productName,
                quantity: {
                    [sequelize.Op.gt]: 0
                }
            },
            attributes: [
                'stock_id',
                'order_id',
                'date',
                'type',
                'name',
                'products',
                'quantity'
            ],
            order: [['date', 'DESC']]
        });
        
        const totalQuantity = stocks.reduce((sum, stock) => {
            return sum + (parseFloat(stock.quantity) || 0);
        }, 0);
        
        res.status(200).json({
            success: true,
            data: {
                productName,
                totalQuantity,
                stockEntries: stocks,
                count: stocks.length
            }
        });
    } catch (error) {
        console.error('Error fetching product stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product stock',
            error: error.message
        });
    }
};



// Update stage1_summary_data status for driver app
const updateStage1Status = async (req, res) => {
    try {
        const { orderId, oiid, driverId } = req.params;
        const { status, dropDriver, collectionStatus } = req.body;

        // Try to find assignment by order_id (oid) first, then by order_auto_id
        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            assignment = await OrderAssignment.findOne({ where: { order_auto_id: orderId } });
        }
        if (!assignment || !assignment.stage1_summary_data) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        const stage1Data = assignment.stage1_summary_data;
        let driverIndex = -1;
        let assignmentIndex = -1;

        stage1Data.driverAssignments?.forEach((driverGroup, dIdx) => {
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
        if (status) updateFields[`stage1_summary_data.driverAssignments[${driverIndex}].assignments[${assignmentIndex}].status`] = status;
        if (dropDriver) updateFields[`stage1_summary_data.driverAssignments[${driverIndex}].assignments[${assignmentIndex}].dropDriver`] = dropDriver;
        if (collectionStatus) updateFields[`stage1_summary_data.driverAssignments[${driverIndex}].assignments[${assignmentIndex}].collectionStatus`] = collectionStatus;

        await assignment.update(updateFields);
        res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating stage1 status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// Update stage3_summary_data status for driver app
const updateStage3Status = async (req, res) => {
    try {
        const { orderId, oiid, driverId } = req.params;
        const { status } = req.body;

        // Try to find assignment by order_id (oid) first, then by order_auto_id
        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            assignment = await OrderAssignment.findOne({ where: { order_auto_id: orderId } });
        }
        if (!assignment || !assignment.stage3_summary_data) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        const stage3Data = assignment.stage3_summary_data;
        let driverIndex = -1;
        let assignmentIndex = -1;

        stage3Data.driverAssignments?.forEach((driverGroup, dIdx) => {
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

        await assignment.update({
            [`stage3_summary_data.driverAssignments[${driverIndex}].assignments[${assignmentIndex}].status`]: status
        });
        res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating stage3 status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

module.exports = {
    getOrderAssignment,
    getOrdersByDriverId,
    getDriverOrdersFromStage1AndStage3,
    updateStage1Assignment,
    updateStage2Assignment,
    updateStage3Assignment,
    updateStage4Assignment,
    saveItemAssignmentUpdate,
    getItemAssignments,
    getAssignmentOptions,
    getAllStock,
    getAvailableStockByProduct,
    getProductStock,
    updateStage1Status,
    updateStage3Status
};