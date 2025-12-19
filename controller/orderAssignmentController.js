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
        const {
            collectionType,
            productAssignments,
            deliveryRoutes,
            summaryData  // NEW: Accept summary data from frontend
        } = req.body;
        
        // Find or create assignment
        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId,
                collection_type: collectionType || 'Box'
            });
        }
        
        // Separate main assignments and remaining assignments
        const mainAssignments = productAssignments.filter(a => !String(a.id).includes('-remaining'));
        const remainingAssignments = productAssignments.filter(a => String(a.id).includes('-remaining'));
        
        // Create item_assignments structure for backward compatibility
        const itemAssignments = {};
        
        // Get tape colors for assignments
        const getTapeColor = async (entityType, entityId) => {
            let entity = null;
            if (entityType === 'farmer') {
                entity = await Farmer.findByPk(entityId, { attributes: ['tape_color'] });
            } else if (entityType === 'supplier') {
                entity = await Supplier.findByPk(entityId, { attributes: ['tape_color'] });
            } else if (entityType === 'thirdParty') {
                entity = await ThirdParty.findByPk(entityId, { attributes: ['tape_color'] });
            }
            return entity?.tape_color || '';
        };
        
        // Process all assignments (main + remaining) with tape color
        for (const assignment of productAssignments) {
            const oiid = String(assignment.id).split('-remaining')[0];
            const tapeColor = await getTapeColor(assignment.entityType, assignment.entityId);
            
            if (!itemAssignments[oiid]) {
                itemAssignments[oiid] = [];
            }
            
            // Add tape color to assignment
            assignment.tapeColor = tapeColor;
            
            itemAssignments[oiid].push({
                entityType: assignment.entityType,
                entityId: assignment.entityId,
                entityName: assignment.assignedTo,
                quantity: parseFloat(assignment.assignedQty) || 0,
                pickedQuantity: parseFloat(assignment.assignedQty) || 0,
                price: parseFloat(assignment.price) || 0,
                tapeColor: tapeColor,
                driver: deliveryRoutes?.find(r => 
                    r.oiid === oiid && 
                    r.entityType === assignment.entityType &&
                    r.location === assignment.assignedTo
                )?.driver || ''
            });
        }
        
        // Validate collection type
        if (!collectionType || !['Box', 'Bag'].includes(collectionType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid collection type. Must be either Box or Bag.'
            });
        }

        // Add assignment_id and timestamp to summary data if provided
        let stage1Summary = null;
        if (summaryData) {
            stage1Summary = {
                assignment_id: assignment.assignment_id,
                driverAssignments: summaryData.driverAssignments?.map(da => ({
                    ...da,
                    assignments: da.assignments?.map(a => ({
                        ...a,
                        status: a.status || 'pending'
                    }))
                })),
                grandTotal: summaryData.grandTotal,
                totalCollections: summaryData.totalCollections,
                totalDrivers: summaryData.totalDrivers,
                totalWeight: summaryData.totalWeight,
                savedAt: new Date().toISOString()
            };
        }

        // Update stage 1 data - store both formats
        await assignment.update({
            collection_type: collectionType,
            product_assignments: productAssignments, // Store form data directly
            item_assignments: itemAssignments, // Keep for backward compatibility
            delivery_routes: deliveryRoutes,
            stage1_summary_data: stage1Summary, // Store summary data from frontend
            stage1_status: 'completed'
        });
        
        res.status(200).json({
            success: true,
            message: 'Stage 1 assignment updated successfully',
            data: {
                assignment,
                summary: stage1Summary
            }
        });
    } catch (error) {
        console.error('Error updating stage 1 assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stage 1 assignment',
            error: error.message
        });
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

        // Check if this is an edit (stage2_status already completed)
        const isEdit = assignment.stage2_status === 'completed';

        // Get order items to find quantity needed
        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'items' }],
            transaction
        });

        // Group by product to validate total packing
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

        // Validate: packed amount + reuse should not exceed quantity needed
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

        // Process reuse first (deduct from stock)
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

        // Delete existing stock entries for this order if editing
        if (isEdit) {
            await Stock.destroy({
                where: { order_id: orderId },
                transaction
            });
        }

        // Process each vendor assignment
        for (const pa of productAssignments) {
            const pickedQty = parseFloat(pa.pickedQuantity) || 0;
            const wastage = parseFloat(pa.wastage) || 0;
            const revisedPicked = pickedQty - wastage;
            const packedAmount = parseFloat(pa.packedAmount) || 0;
            const productName = pa.product;

            // Calculate remaining stock for this vendor
            const remainingStock = revisedPicked - packedAmount;

            // Store remaining stock if positive
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
                labourId: pa.labourId,
                labourName: pa.labourName,
                status: pa.status || 'pending'
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
                        tapeColor: pa.tapeColor,
                        labourId: pa.labourId,
                        labourName: pa.labourName,
                        status: pa.status || 'pending'
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
        
        // Validate products
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                message: 'Products are required'
            });
        }
        
        // Find or create assignment
        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId
            });
        }
        
        // Build stage3_summary_data
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
                totalProducts: summaryData.totalProducts || 0,
                totalDrivers: summaryData.totalDrivers || 0,
                totalPackages: summaryData.totalPackages || 0,
                totalWeight: summaryData.totalWeight || 0,
                savedAt: new Date().toISOString()
            };
        }
        
        // Update stage 3 data with new structure
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
                    selectedDriver: p.selectedDriver || '',
                    airportName: p.airportName || '',
                    airportLocation: p.airportLocation || '',
                    vehicleNumber: p.vehicleNumber || '',
                    phoneNumber: p.phoneNumber || '',
                    vehicleCapacity: p.vehicleCapacity || '',
                    status: p.status || 'pending',
                    assignmentIndex: p.assignmentIndex || 0
                })),
                completedAt: new Date()
            },
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
    saveItemAssignmentUpdate,
    getItemAssignments,
    getAssignmentOptions,
    getAllStock,
    getAvailableStockByProduct,
    getProductStock   
};