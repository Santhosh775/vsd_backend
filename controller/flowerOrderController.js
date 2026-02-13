const FlowerOrderAssignment = require('../model/flowerOrderModel');
const { Order, OrderItem, Stock, Driver } = require('../model/associations');
const { sequelize } = require('../config/db');
const FLOWER_ORDER_TYPE = 'flower order';

function isFlowerOrder(order) {
    const t = (order?.order_type || '').toLowerCase();
    return t === 'flower order' || t === 'flower';
}

// Get flower order assignment by order ID (only for FLOWER ORDER type)
const getFlowerOrderAssignment = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'items', attributes: ['oiid', 'product_name', 'num_boxes', 'packing_type', 'net_weight', 'gross_weight'] }]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!isFlowerOrder(order)) {
            return res.status(400).json({
                success: false,
                message: 'This is not a flower order. Use the order-assignment endpoint for box orders or local order endpoint for local orders.'
            });
        }

        let assignment = await FlowerOrderAssignment.findOne({
            where: { order_id: orderId }
        });

        if (!assignment) {
            assignment = await FlowerOrderAssignment.create({
                order_id: orderId,
                order_auto_id: order.order_id,
                order_type: order.order_type
            });
        }

        const assignmentData = assignment.toJSON();
        assignmentData.order = order.toJSON();

        if (assignmentData.stage2_data?.productAssignments) {
            assignmentData.stage2_assignments = assignmentData.stage2_data.productAssignments;
        }

        res.status(200).json({ success: true, data: assignmentData });
    } catch (error) {
        console.error('Error fetching flower order assignment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch flower order assignment', error: error.message });
    }
};

// Update Stage 1 - Product Collection
const updateStage1Assignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderType, collectionType, productAssignments, deliveryRoutes, summaryData } = req.body;

        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (!isFlowerOrder(order)) {
            return res.status(400).json({ success: false, message: 'This is not a flower order.' });
        }

        let assignment = await FlowerOrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            assignment = await FlowerOrderAssignment.create({
                order_id: orderId,
                order_auto_id: order?.order_id,
                order_type: order.order_type
            });
        }

        const processedAssignments = (productAssignments || []).map(pa => ({
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

        const processedRoutes = (deliveryRoutes || []).map(route => ({
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

        // Build stage1_summary_data with driverId stored exactly as received (typically driver's driver_id string)
        let stage1SummaryData = summaryData || null;
        let stage1Status = 'pending';
        if (summaryData?.driverAssignments && Array.isArray(summaryData.driverAssignments)) {
            stage1SummaryData = {
                ...summaryData,
                driverAssignments: summaryData.driverAssignments.map(driverGroup => {
                    return {
                        ...driverGroup,
                        // Preserve whatever identifier the frontend sends (prefer driverId, then driver_id),
                        // and store it as a string so alphanumeric IDs like "DR001" are not coerced.
                        driverId: driverGroup.driverId != null
                            ? String(driverGroup.driverId)
                            : (driverGroup.driver_id != null ? String(driverGroup.driver_id) : null)
                    };
                })
            };

            const allAssignments = [];
            summaryData.driverAssignments.forEach(driverGroup => {
                if (driverGroup.assignments && Array.isArray(driverGroup.assignments)) {
                    allAssignments.push(...driverGroup.assignments);
                }
            });
            if (allAssignments.length > 0) {
                const allCompleted = allAssignments.every(a => (a.status || '').toLowerCase() === 'completed');
                if (allCompleted) stage1Status = 'completed';
            }
        }

        await assignment.update({
            order_type: orderType || order.order_type,
            collection_type: collectionType || assignment.collection_type,
            product_assignments: processedAssignments,
            delivery_routes: processedRoutes,
            stage1_summary_data: stage1SummaryData,
            stage1_status: stage1Status
        });

        res.status(200).json({ success: true, message: 'Stage 1 saved successfully', data: assignment });
    } catch (error) {
        console.error('Error updating flower stage 1:', error);
        res.status(500).json({ success: false, message: 'Failed to update stage 1', error: error.message });
    }
};

// Update Stage 2 - Packaging (reuse same Stock logic as orderAssignmentController)
const updateStage2Assignment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { orderId } = req.params;
        const { productAssignments, summaryData } = req.body;

        if (!productAssignments || !Array.isArray(productAssignments)) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Product assignments are required' });
        }

        const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }], transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (!isFlowerOrder(order)) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'This is not a flower order.' });
        }

        let assignment = await FlowerOrderAssignment.findOne({ where: { order_id: orderId }, transaction });
        if (!assignment) {
            assignment = await FlowerOrderAssignment.create({
                order_id: orderId,
                order_auto_id: order?.order_id,
                order_type: order.order_type
            }, { transaction });
        }

        const productGroups = {};
        productAssignments.forEach(pa => {
            const oiid = pa.id;
            if (!productGroups[oiid]) {
                productGroups[oiid] = { product: pa.product, vendors: [], reuse: parseFloat(pa.reuse) || 0 };
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
        const processedReuse = {};

        for (const [oiid, group] of Object.entries(productGroups)) {
            const reuseInput = group.reuse;
            const productName = group.product;
            let reuseFromStock = 0;
            if (reuseInput > 0) {
                const stocks = await Stock.findAll({
                    where: { products: productName },
                    order: [['date', 'DESC']],
                    transaction
                });
                let reuseRemaining = reuseInput;
                for (const stock of stocks) {
                    if (reuseRemaining <= 0) break;
                    const stockQty = parseFloat(stock.quantity) || 0;
                    if (stockQty > 0) {
                        const deduction = Math.min(stockQty, reuseRemaining);
                        reuseFromStock += deduction;
                        reuseRemaining -= deduction;
                        const newQty = stockQty - deduction;
                        if (newQty <= 0) await stock.destroy({ transaction });
                        else await stock.update({ quantity: newQty }, { transaction });
                    }
                }
            }
            processedReuse[oiid] = reuseFromStock;
        }

        const isEdit = assignment.stage2_status === 'completed';
        if (isEdit) {
            await Stock.destroy({ where: { order_id: orderId }, transaction });
        }

        for (const pa of productAssignments) {
            const pickedQty = parseFloat(pa.pickedQuantity) || 0;
            const wastage = parseFloat(pa.wastage) || 0;
            const revisedPicked = pickedQty - wastage;
            const packedAmount = parseFloat(pa.packedAmount) || 0;
            const productName = pa.product;
            const remainingStock = revisedPicked - packedAmount;
            if (remainingStock > 0.01) {
                await Stock.create({
                    order_id: orderId,
                    date: today,
                    type: pa.entityType,
                    name: pa.entityName,
                    products: productName,
                    quantity: parseFloat(remainingStock.toFixed(2)),
                    // Store system time from this Node server when stock was created
                    stock_creation_time: new Date()
                }, { transaction });
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

        let stage2Summary = null;
        if (summaryData) {
            stage2Summary = {
                flower_assignment_id: assignment.flower_assignment_id,
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

        let stage2Status = 'pending';
        if (summaryData?.labourAssignments && Array.isArray(summaryData.labourAssignments)) {
            const allAssignments = [];
            summaryData.labourAssignments.forEach(labourGroup => {
                if (labourGroup.assignments && Array.isArray(labourGroup.assignments)) {
                    allAssignments.push(...labourGroup.assignments);
                }
            });
            if (allAssignments.length > 0) {
                const allCompleted = allAssignments.every(a => (a.status || '').toLowerCase() === 'completed');
                if (allCompleted) stage2Status = 'completed';
            }
        }

        await assignment.update({
            stage2_data: {
                productAssignments: productAssignments.map(pa => ({
                    id: pa.id,
                    product: pa.product,
                    entityType: pa.entityType,
                    entityName: pa.entityName,
                    pickedQuantity: parseFloat(pa.pickedQuantity) || 0,
                    wastage: parseFloat(pa.wastage) || 0,
                    revisedPicked: (parseFloat(pa.pickedQuantity) || 0) - (parseFloat(pa.wastage) || 0),
                    packedAmount: parseFloat(pa.packedAmount) || 0,
                    reuse: parseFloat(pa.reuse) || 0,
                    labourId: pa.labourId || '',
                    labourName: pa.labourName || '',
                    labourData: pa.labourData || {},
                    status: pa.status || 'pending',
                    startTime: pa.startTime || '',
                    endTime: pa.endTime || ''
                })),
                stage2Assignments,
                completedAt: new Date()
            },
            stage2_summary_data: stage2Summary,
            stage2_status: stage2Status
        }, { transaction });

        await transaction.commit();
        res.status(200).json({
            success: true,
            message: 'Stage 2 completed. Stock updated successfully.',
            data: { assignment, summary: stage2Summary, stage2Assignments }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Flower Stage 2 Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update stage 2', error: error.message });
    }
};

// Helpers for Stage 3 (tape normalization - same as orderAssignmentController)
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

// Update Stage 3 - Airport Delivery
const updateStage3Assignment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { orderId } = req.params;
        const { products, summaryData, airportTapeData, isEdit: isEditFromBody } = req.body;

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ success: false, message: 'Products are required' });
        }

        const order = await Order.findByPk(orderId, { transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (!isFlowerOrder(order)) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'This is not a flower order.' });
        }

        let assignment = await FlowerOrderAssignment.findOne({ where: { order_id: orderId }, transaction });
        if (!assignment) {
            assignment = await FlowerOrderAssignment.create({
                order_id: orderId,
                order_auto_id: order?.order_id,
                order_type: order.order_type
            }, { transaction });
        }

        const hasExistingStage3 = !!assignment.stage3_data;
        const isEdit = !!isEditFromBody || hasExistingStage3;

        if (!isEdit) {
            const tapeUsageMap = {};
            if (airportTapeData) {
                forEachTapeEntry(airportTapeData, (info) => {
                    const key = (info.tapeName || info.tapeColor || '').toString().trim();
                    const qty = parseFloat(info.tapeQuantity) || 0;
                    if (key && qty > 0) tapeUsageMap[key] = (tapeUsageMap[key] || 0) + qty;
                });
            }
            if (Object.keys(tapeUsageMap).length === 0) {
                products.forEach(p => {
                    const key = (p.tapeName || p.tapeColor || '').toString().trim();
                    if (key && p.tapeQuantity != null && p.tapeQuantity !== '') {
                        const qty = parseFloat(p.tapeQuantity) || 0;
                        if (qty > 0) tapeUsageMap[key] = (tapeUsageMap[key] || 0) + qty;
                    }
                });
            }

            const { Inventory } = require('../model/associations');
            for (const [tapeKey, quantityChange] of Object.entries(tapeUsageMap)) {
                if (!tapeKey || quantityChange === 0) continue;
                let tape = await Inventory.findOne({ where: { category: 'Tape', name: tapeKey }, transaction });
                if (!tape) tape = await Inventory.findOne({ where: { category: 'Tape', color: tapeKey }, transaction });
                if (!tape) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, message: `Tape "${tapeKey}" not found in inventory` });
                }
                const currentQty = parseFloat(tape.quantity) || 0;
                const newQuantity = currentQty - quantityChange;
                if (newQuantity < 0) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, message: `Insufficient tape inventory for "${tapeKey}". Available: ${tape.quantity}, Required: ${quantityChange}` });
                }
                await tape.update({ quantity: newQuantity }, { transaction });
            }
        }

        const normalizedAirportTapes = normalizeAirportTapesToArray(airportTapeData);
        let airportGroupsWithTape = summaryData?.airportGroups || {};
        if (summaryData?.airportGroups) {
            airportGroupsWithTape = Object.fromEntries(
                Object.entries(summaryData.airportGroups).map(([code, group]) => {
                    const airportName = group.airportName;
                    const tapesArray = (airportName && normalizedAirportTapes[airportName]) || [];
                    const firstTape = Array.isArray(tapesArray) && tapesArray.length > 0 ? tapesArray[0] : {};
                    return [code, {
                        ...group,
                        tapes: Array.isArray(tapesArray) ? tapesArray : [firstTape],
                        tapeName: firstTape.tapeName ?? group.tapeName ?? '',
                        tapeQuantity: firstTape.tapeQuantity != null ? firstTape.tapeQuantity : (group.tapeQuantity ?? ''),
                        tapeColor: firstTape.tapeColor ?? group.tapeColor ?? ''
                    }];
                })
            );
        }

        let stage3Summary = null;
        if (summaryData) {
            stage3Summary = {
                flower_assignment_id: assignment.flower_assignment_id,
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
                airportGroups: airportGroupsWithTape,
                airportTapeData: normalizedAirportTapes,
                totalProducts: summaryData.totalProducts || 0,
                totalDrivers: summaryData.totalDrivers || 0,
                totalPackages: summaryData.totalPackages || 0,
                totalWeight: summaryData.totalWeight || 0,
                savedAt: new Date().toISOString()
            };
        }

        let stage3Status = 'in_progress';
        if (summaryData?.driverAssignments && Array.isArray(summaryData.driverAssignments)) {
            const allAssignments = [];
            summaryData.driverAssignments.forEach(driverGroup => {
                if (driverGroup.assignments && Array.isArray(driverGroup.assignments)) {
                    allAssignments.push(...driverGroup.assignments);
                }
            });
            if (allAssignments.length > 0) {
                const allCompleted = allAssignments.every(a => (a.status || '').toLowerCase() === 'completed');
                if (allCompleted) stage3Status = 'completed';
            }
        }

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
                airportTapeData: normalizedForStorage
            },
            stage3_summary_data: stage3Summary,
            stage3_status: stage3Status
        }, { transaction });

        await transaction.commit();
        res.status(200).json({
            success: true,
            message: 'Stage 3 assignment updated successfully',
            data: { assignment, summary: stage3Summary }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating flower stage 3:', error);
        res.status(500).json({ success: false, message: 'Failed to update stage 3', error: error.message });
    }
};

// Update Stage 4 - Review
const updateStage4Assignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const stage4Data = req.body;

        if (stage4Data.reviewData?.productRows) {
            const invalidPrices = stage4Data.reviewData.productRows.filter(row => !row.marketPrice || row.marketPrice === 0);
            if (invalidPrices.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot submit Stage 4: Market prices are not updated for some products. Please update product prices before proceeding.',
                    invalidProducts: invalidPrices.map(p => p.product_name || p.product)
                });
            }
        }

        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (!isFlowerOrder(order)) return res.status(400).json({ success: false, message: 'This is not a flower order.' });

        let assignment = await FlowerOrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Flower order assignment not found' });
        }

        await assignment.update({
            stage4_data: { ...stage4Data, completedAt: new Date() },
            stage4_status: 'completed'
        });

        res.status(200).json({
            success: true,
            message: 'Stage 4 review data saved successfully',
            data: assignment
        });
    } catch (error) {
        console.error('Error updating flower stage 4:', error);
        res.status(500).json({ success: false, message: 'Failed to update stage 4', error: error.message });
    }
};

// Update stage1_summary_data status for driver app
const updateStage1Status = async (req, res) => {
    try {
        const { orderId, oiid, driverId } = req.params;
        const { status, dropDriver, collectionStatus } = req.body;

        // Try to find assignment by order_id (oid) first, then by order_auto_id
        let assignment = await FlowerOrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            assignment = await FlowerOrderAssignment.findOne({ where: { order_auto_id: orderId } });
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
        console.error('Error updating flower stage1 status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// Update stage3_summary_data status for driver app
const updateStage3Status = async (req, res) => {
    try {
        const { orderId, oiid, driverId } = req.params;
        const { status } = req.body;

        // Try to find assignment by order_id (oid) first, then by order_auto_id
        let assignment = await FlowerOrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            assignment = await FlowerOrderAssignment.findOne({ where: { order_auto_id: orderId } });
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
        console.error('Error updating flower stage3 status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

module.exports = {
    getFlowerOrderAssignment,
    updateStage1Assignment,
    updateStage2Assignment,
    updateStage3Assignment,
    updateStage4Assignment,
    updateStage1Status,
    updateStage3Status
};