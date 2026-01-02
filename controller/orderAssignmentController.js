const { OrderAssignment, Order, OrderItem, Farmer, Supplier, ThirdParty, Labour, Driver, Stock } = require('../model/associations');
const { sequelize } = require('../config/db');

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
            // Create a new assignment if it doesn't exist
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
            
            const newAssignment = await OrderAssignment.create({
                order_id: orderId,
                collection_type: 'Box' // Default value
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
        const { orderType, collectionType, productAssignments, deliveryRoutes, summaryData } = req.body;
        
        if (!collectionType || !['Box', 'Bag'].includes(collectionType)) {
            return res.status(400).json({ success: false, message: 'Invalid collection type' });
        }

        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId } });
        if (!assignment) {
            assignment = await OrderAssignment.create({ order_id: orderId, collection_type: collectionType });
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
            tapeColor: pa.tapeColor || ''
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

        // Update assignment
        await assignment.update({
            order_type: orderType,
            collection_type: collectionType,
            product_assignments: processedAssignments,
            delivery_routes: processedRoutes,
            stage1_summary_data: summaryData,
            stage1_status: 'completed'
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

        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId }, transaction });
        if (!assignment) {
            assignment = await OrderAssignment.create({ order_id: orderId }, { transaction });
        }

        const isEdit = assignment.stage2_status === 'completed';

        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'items' }],
            transaction
        });

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
                        
                        if (newQty <= 0) {
                            await stock.destroy({ transaction });
                        } else {
                            await stock.update({ quantity: newQty }, { transaction });
                        }
                    }
                }
            }
            processedReuse[oiid] = reuseFromStock;
        }

        if (isEdit) {
            await Stock.destroy({
                where: { order_id: orderId },
                transaction
            });
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
                    quantity: parseFloat(remainingStock.toFixed(2))
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
                tapeColor: pa.tapeColor,
                tapeQuantity: pa.tapeQuantity,
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
                assignment_id: assignment.assignment_id,
                labourAssignments: summaryData.labourAssignments,
                totalLabours: summaryData.totalLabours,
                totalProducts: summaryData.totalProducts,
                totalPicked: summaryData.totalPicked,
                totalWastage: summaryData.totalWastage,
                totalReuse: summaryData.totalReuse,
                savedAt: new Date().toISOString()
            };
        }

        await assignment.update({
            stage2_data: {
                productAssignments: productAssignments.map(pa => {
                    const pickedQty = parseFloat(pa.pickedQuantity) || 0;
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
                        tapeColor: pa.tapeColor || '',
                        tapeQuantity: pa.tapeQuantity || '',
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
            stage2_status: 'completed'
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

// Update order assignment (Stage 3)
const updateStage3Assignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { products, summaryData } = req.body;
        
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                message: 'Products are required'
            });
        }
        
        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId
            });
        }
        
        let stage3Summary = null;
        if (summaryData) {
            stage3Summary = {
                assignment_id: assignment.assignment_id,
                driverAssignments: summaryData.driverAssignments?.map(da => ({
                    driver: da.driver,
                    driverId: da.driverId ? parseInt(da.driverId) : null,
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
                        airportName: a.airportName || '',
                        airportLocation: a.airportLocation || '',
                        status: a.status || 'pending',
                        oiid: a.oiid
                    }))
                })),
                airportGroups: summaryData.airportGroups || {},
                totalProducts: summaryData.totalProducts || 0,
                totalDrivers: summaryData.totalDrivers || 0,
                totalPackages: summaryData.totalPackages || 0,
                totalWeight: summaryData.totalWeight || 0,
                savedAt: new Date().toISOString()
            };
        }
        
        await assignment.update({
            stage3_assignments: products.map(p => ({
                id: p.id,
                oiid: p.oiid,
                product: p.product,
                grossWeight: p.grossWeight,
                totalBoxes: p.totalBoxes || 0,
                labour: p.labour || '-',
                ct: p.ct || '',
                noOfPkgs: p.noOfPkgs || '',
                selectedDriver: p.selectedDriver || '',
                airportName: p.airportName || '',
                airportLocation: p.airportLocation || '',
                vehicleNumber: p.vehicleNumber || '',
                phoneNumber: p.phoneNumber || '',
                vehicleCapacity: p.vehicleCapacity || '',
                status: p.status || 'pending',
                assignmentIndex: p.assignmentIndex || 0
            })),
            stage3_summary_data: stage3Summary,
            stage3_status: 'completed'
        });
        
        res.status(200).json({
            success: true,
            message: 'Stage 3 assignment updated successfully',
            data: {
                assignment,
                summary: stage3Summary
            }
        });
    } catch (error) {
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
        
        console.log('Received Stage 4 data:', JSON.stringify(stage4Data, null, 2));
        
        let assignment = await OrderAssignment.findOne({ where: { order_id: orderId } });
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Order assignment not found'
            });
        }
        
        // Process and store the stage 4 data
        const processedStage4Data = {
            reviewData: stage4Data.reviewData || {},
            status: stage4Data.status || 'completed',
            completedAt: new Date().toISOString(),
            orderId: orderId
        };
        
        await assignment.update({
            stage4_data: processedStage4Data,
            stage4_status: 'completed'
        });
        
        console.log('Stage 4 data saved successfully');
        
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
        
        // Find or create assignment
        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId,
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



module.exports = {
    getOrderAssignment,
    updateStage1Assignment,
    updateStage2Assignment,
    updateStage3Assignment,
    updateStage4Assignment,
    saveItemAssignmentUpdate,
    getItemAssignments,
    getAssignmentOptions,
    getAllStock,
    getAvailableStockByProduct,
    getProductStock   
};