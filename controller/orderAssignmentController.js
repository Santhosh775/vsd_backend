const { OrderAssignment, Order, OrderItem, Farmer, Supplier, ThirdParty, Labour, Driver } = require('../model/associations');

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
                order_id: orderId
            });
            
            return res.status(200).json({
                success: true,
                data: {
                    ...newAssignment.toJSON(),
                    order: order.toJSON()
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: assignment
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

// Update order assignment (Stage 1)
const updateStage1Assignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const {
            collectionType,
            productAssignments,
            deliveryRoutes
        } = req.body;
        
        // Find or create assignment
        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId
            });
        }
        
        // Update stage 1 data
        await assignment.update({
            collection_type: collectionType,
            product_assignments: productAssignments,
            delivery_routes: deliveryRoutes,
            stage1_status: 'completed'
        });
        
        res.status(200).json({
            success: true,
            message: 'Stage 1 assignment updated successfully',
            data: assignment
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

// Update order assignment (Stage 2)
const updateStage2Assignment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const {
            packagingStatus,
            packagingDate,
            readyForDispatch,
            netWeight,
            grossWeight,
            packageCount,
            airportDriverId,
            specialInstructions
        } = req.body;
        
        // Find or create assignment
        let assignment = await OrderAssignment.findOne({
            where: { order_id: orderId }
        });
        
        if (!assignment) {
            assignment = await OrderAssignment.create({
                order_id: orderId
            });
        }
        
        // Update stage 2 data
        await assignment.update({
            packaging_status: packagingStatus,
            packaging_date: packagingDate,
            ready_for_dispatch: readyForDispatch,
            net_weight: netWeight,
            gross_weight: grossWeight,
            package_count: packageCount,
            airport_driver_id: airportDriverId,
            special_instructions: specialInstructions,
            stage2_status: 'completed'
        });
        
        res.status(200).json({
            success: true,
            message: 'Stage 2 assignment updated successfully',
            data: assignment
        });
    } catch (error) {
        console.error('Error updating stage 2 assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stage 2 assignment',
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
            attributes: ['fid', 'farmer_name']
        });
        
        // Get all active suppliers
        const suppliers = await Supplier.findAll({
            where: { status: 'active' },
            attributes: ['sid', 'supplier_name']
        });
        
        // Get all active third parties
        const thirdParties = await ThirdParty.findAll({
            where: { status: 'active' },
            attributes: ['tpid', 'third_party_name']
        });
        
        // Get all active labours
        const labours = await Labour.findAll({
            where: { status: 'Active' },
            attributes: ['lid', 'full_name']
        });
        
        // Get all available drivers
        const drivers = await Driver.findAll({
            where: { status: 'Available' },
            attributes: ['did', 'driver_id', 'driver_name']
        });
        
        res.status(200).json({
            success: true,
            data: {
                farmers: farmers.map(f => ({
                    id: f.fid,
                    name: f.farmer_name,
                    type: 'farmer'
                })),
                suppliers: suppliers.map(s => ({
                    id: s.sid,
                    name: s.supplier_name,
                    type: 'supplier'
                })),
                thirdParties: thirdParties.map(tp => ({
                    id: tp.tpid,
                    name: tp.third_party_name,
                    type: 'thirdParty'
                })),
                labours: labours.map(l => ({
                    id: l.lid,
                    name: l.full_name
                })),
                drivers: drivers.map(d => ({
                    id: d.did,
                    driverId: d.driver_id,
                    name: d.driver_name
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

module.exports = {
    getOrderAssignment,
    updateStage1Assignment,
    updateStage2Assignment,
    getAssignmentOptions
};