const { Order, OrderItem, Product } = require('../model/associations');
const Inventory = require('../model/inventoryModel');
const { sequelize } = require('../config/db');
const { handleValidationErrors } = require('../validator/orderValidator');

// Generate order_id from customer name, order received date, and sequence number
const generateOrderId = async (customerName, orderReceivedDate, transaction) => {
    const name = customerName.replace(/\s+/g, '').toUpperCase();
    const date = new Date(orderReceivedDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const baseOrderId = `${name}_${day}-${month}-${year}`;
    
    // Find existing orders with the same base order_id pattern
    const { Op } = require('sequelize');
    const existingOrders = await Order.findAll({
        where: {
            order_id: {
                [Op.like]: `${baseOrderId}%`
            }
        },
        transaction
    });
    
    // If no existing orders, return base order_id
    if (existingOrders.length === 0) {
        return baseOrderId;
    }
    
    // Otherwise, append sequence number
    const sequenceNumber = existingOrders.length + 1;
    return `${baseOrderId}_${sequenceNumber}`;
};

// Helper function to transform order items according to the specification
const transformOrderItems = (items) => {
    return items.map(item => {
        const productId = item.product ? item.product.pid : null;
        const productName = item.product ? item.product.product_name : item.product_name;

        const formattedProduct = productId ? `${productId} - ${productName}` : productName;

        const transformedItem = {
            oiid: item.oiid,
            order_id: item.order_id,
            product: formattedProduct,
            num_boxes: item.num_boxes,
            packing_type: item.packing_type,
            net_weight: item.net_weight,
            gross_weight: item.gross_weight,
            box_weight: item.box_weight,
            market_price: item.market_price ?? (item.product ? item.product.current_price : "0.00"),
            total_price: item.total_price,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        };

        return transformedItem;
    });
};

// Products that use inner 5KG GREEN BAG (inventory id 10) along with their packing type
const INNER_BAG_INVENTORY_ID = 10;
const INNER_BAG_NAME = '5KG GREEN BAG';
const INNER_BAG_RULES = [
    { pids: [33, 34], packingType: '10KG BOX', bagsPerBox: 2 },           // garlic/ginger: 2 bags per 10KG BOX
    { pids: [52], packingType: '5KG BOX', bagsPerBox: 1 },                // groundnut: 1 bag per 5KG BOX
    { pids: [30, 31, 32], packingType: '10KG YELLOW BAG', bagsPerBox: 1 }, // small yam, big yam, seppai: 2 bags per 10KG YELLOW BAG
    { pids: [29, 35, 37], packingType: '10KG YELLOW BAG', bagsPerBox: 2 }  // pid 29, 35, 37: 2x 5KG GREEN BAG per 10KG YELLOW BAG
];

// Normalize packing type for rule matching (trim, collapse spaces, uppercase, normalize "KG")
const normalizePackingType = (packingType) => {
    if (packingType == null || typeof packingType !== 'string') return '';
    let s = String(packingType).replace(/\s+/g, ' ').trim().toUpperCase();
    s = s.replace(/\s*KG\s*/gi, 'KG ');
    return s.replace(/\s+/g, ' ').trim();
};

// Helper function to reduce inventory based on order items
const reduceInventory = async (orderItems, transaction) => {
    for (const item of orderItems) {
        if (item.num_boxes && item.packing_type) {
            const numBoxesStr = String(item.num_boxes);
            const match = numBoxesStr.match(/^(\d+(?:\.\d+)?)(box|bag)?/i);
            const numBoxes = match ? parseFloat(match[1]) : 0;
            
            if (numBoxes > 0) {
                const inventoryItem = await Inventory.findOne({
                    where: {
                        name: item.packing_type
                    },
                    transaction
                });
                
                if (inventoryItem && inventoryItem.quantity >= numBoxes) {
                    await inventoryItem.update({
                        quantity: parseFloat(inventoryItem.quantity) - numBoxes
                    }, { transaction });
                } else {
                    throw new Error(`Insufficient ${item.packing_type} inventory. Required: ${numBoxes}, Available: ${inventoryItem ? inventoryItem.quantity : 0}`);
                }

                // Reduce inner 5KG GREEN BAG (id 10) when product+packing matches rules
                const packingNorm = normalizePackingType(item.packing_type);
                const productIdNum = Number(item.product_id);
                const rule = INNER_BAG_RULES.find(
                    r => !Number.isNaN(productIdNum) && r.pids.includes(productIdNum) && r.packingType === packingNorm
                );
                if (rule) {
                    const innerBagQty = rule.bagsPerBox * numBoxes;
                    let innerBag = await Inventory.findByPk(INNER_BAG_INVENTORY_ID, { transaction });
                    if (!innerBag) {
                        innerBag = await Inventory.findOne({ where: { name: INNER_BAG_NAME }, transaction });
                    }
                    if (!innerBag) {
                        throw new Error(`5KG GREEN BAG (inner packing) not found in inventory (id ${INNER_BAG_INVENTORY_ID} or name "${INNER_BAG_NAME}"). Cannot reduce for product ${item.product_id}.`);
                    }
                    const currentQty = parseFloat(innerBag.quantity) || 0;
                    if (currentQty >= innerBagQty) {
                        await innerBag.update({
                            quantity: currentQty - innerBagQty
                        }, { transaction });
                    } else {
                        throw new Error(`Insufficient 5KG GREEN BAG (inner packing) inventory. Required: ${innerBagQty}, Available: ${currentQty}`);
                    }
                }
            }
        }
    }
};

// Helper function to restore inventory (for updates)
const restoreInventory = async (orderItems, transaction) => {
    for (const item of orderItems) {
        if (item.num_boxes && item.packing_type) {
            const numBoxesStr = String(item.num_boxes);
            const match = numBoxesStr.match(/^(\d+(?:\.\d+)?)(box|bag)?/i);
            const numBoxes = match ? parseFloat(match[1]) : 0;
            
            if (numBoxes > 0) {
                const inventoryItem = await Inventory.findOne({
                    where: {
                        name: item.packing_type
                    },
                    transaction
                });
                
                if (inventoryItem) {
                    await inventoryItem.update({
                        quantity: parseFloat(inventoryItem.quantity) + numBoxes
                    }, { transaction });
                }

                // Restore inner 5KG GREEN BAG (id 10) when product+packing matches rules
                const packingNorm = normalizePackingType(item.packing_type);
                const productIdNum = Number(item.product_id);
                const rule = INNER_BAG_RULES.find(
                    r => !Number.isNaN(productIdNum) && r.pids.includes(productIdNum) && r.packingType === packingNorm
                );
                if (rule) {
                    const innerBagQty = rule.bagsPerBox * numBoxes;
                    let innerBag = await Inventory.findByPk(INNER_BAG_INVENTORY_ID, { transaction });
                    if (!innerBag) {
                        innerBag = await Inventory.findOne({ where: { name: INNER_BAG_NAME }, transaction });
                    }
                    if (innerBag) {
                        const currentQty = parseFloat(innerBag.quantity) || 0;
                        await innerBag.update({
                            quantity: currentQty + innerBagQty
                        }, { transaction });
                    }
                }
            }
        }
    }
};



// Map frontend orderType (flight/local/flower) or display name to DB order_type
const getOrderTypeForDB = (orderType) => {
    if (!orderType) return 'LOCAL GRADE ORDER';
    if (orderType === 'flight') return 'BOX ORDER';
    if (orderType === 'local') return 'LOCAL GRADE ORDER';
    if (orderType === 'flower') return 'FLOWER ORDER';
    if (['BOX ORDER', 'LOCAL GRADE ORDER', 'FLOWER ORDER'].includes(orderType)) return orderType;
    return orderType;
};

// Helper function to transform orders according to the specification
const transformOrder = (order) => {
    const transformedOrder = order.toJSON();
    
    if (transformedOrder.items) {
        transformedOrder.items = transformOrderItems(transformedOrder.items);
    }
    
    return transformedOrder;
};

// Create a new order
const createOrder = async (req, res) => {
    const validationErrors = handleValidationErrors(req, res, () => {});
    if (validationErrors && validationErrors.statusCode) {
        return validationErrors;
    }

    const t = await sequelize.transaction();
    try {
        const {
            customerName,
            customerId,
            orderReceivedDate,
            packingDate,
            packingDay,
            orderType,
            detailsComment,
            totalNetWeight,
            totalNumBoxes,
            totalGrossWeight,
            products
        } = req.body;

        const orderId = await generateOrderId(customerName, orderReceivedDate, t);

        const orderData = {
            order_id: orderId,
            customer_name: customerName,
            customer_id: customerId,
            order_received_date: orderReceivedDate,
            packing_date: packingDate,
            packing_day: packingDay,
            order_type: getOrderTypeForDB(orderType),
            details_comment: detailsComment,
            total_net_weight: totalNetWeight != null && totalNetWeight !== '' ? parseFloat(totalNetWeight) : null,
            total_no_of_boxes: totalNumBoxes != null && totalNumBoxes !== '' ? parseFloat(totalNumBoxes) : null,
            total_gross_weight: totalGrossWeight != null && totalGrossWeight !== '' ? parseFloat(totalGrossWeight) : null
        };

        const order = await Order.create(orderData, { transaction: t });

        if (products && products.length > 0) {
            const productIds = products
                .map(product => product.productId)
                .filter(productId => productId !== null && productId !== undefined);
            
            const productMap = {};
            if (productIds.length > 0) {
                const productRecords = await Product.findAll({
                    where: {
                        pid: productIds
                    }
                });
                
                productRecords.forEach(product => {
                    productMap[product.pid] = product;
                });
            }
            
            const orderItems = products.map((product) => {
                const productDetails = productMap[product.productId];
                
                const netWeight = parseFloat(product.netWeight) || 0;
                
                let totalPrice = 0;
                if (productDetails) {
                    const marketPrice = parseFloat(productDetails.current_price) || 0;
                    totalPrice = netWeight * marketPrice;
                }
                
                // For local orders without detailed info, store only product and net weight
                const hasDetailedInfo = product.numBoxes || product.packingType || product.grossWeight || product.boxWeight;
                
                return {
                    order_id: orderId,
                    product_id: product.productId || null,
                    product_name: productDetails ? productDetails.product_name : null,
                    market_price: productDetails ? productDetails.current_price : 0.00,
                    total_price: totalPrice,
                    num_boxes: hasDetailedInfo ? product.numBoxes : null,
                    packing_type: hasDetailedInfo ? product.packingType : null,
                    net_weight: product.netWeight,
                    gross_weight: hasDetailedInfo ? product.grossWeight : null,
                    box_weight: hasDetailedInfo ? product.boxWeight : null
                };
            });

            await OrderItem.bulkCreate(orderItems, { transaction: t });
            
            // Reduce inventory based on order items
            await reduceInventory(orderItems, t);
        }

        await t.commit();

        const fullOrder = await Order.findByPk(order.oid, {
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['pid', 'product_name', 'current_price', 'unit']
                }]
            }]
        });

        const transformedOrder = transformOrder(fullOrder);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: transformedOrder
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

// Get all orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['pid', 'product_name', 'current_price', 'unit']
                }]
            }]
        });

        const transformedOrders = orders.map(order => transformOrder(order));

        res.status(200).json({
            success: true,
            data: transformedOrders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    const validationErrors = handleValidationErrors(req, res, () => {});
    if (validationErrors && validationErrors.statusCode) {
        return validationErrors;
    }

    try {
        const { id } = req.params;
        const order = await Order.findByPk(id, {
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['pid', 'product_name', 'current_price', 'unit']
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const transformedOrder = transformOrder(order);

        res.status(200).json({
            success: true,
            data: transformedOrder
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    }
};

// Update order
const updateOrder = async (req, res) => {
    const validationErrors = handleValidationErrors(req, res, () => {});
    if (validationErrors && validationErrors.statusCode) {
        return validationErrors;
    }

    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            customerName,
            customerId,
            orderReceivedDate,
            packingDate,
            packingDay,
            orderType,
            detailsComment,
            totalNetWeight,
            totalNumBoxes,
            totalGrossWeight,
            products
        } = req.body;

        const order = await Order.findByPk(id, { transaction: t });
        if (!order) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const updateData = {
            customer_name: customerName,
            customer_id: customerId,
            order_received_date: orderReceivedDate,
            packing_date: packingDate,
            packing_day: packingDay,
            order_type: getOrderTypeForDB(orderType),
            details_comment: detailsComment,
            total_net_weight: totalNetWeight != null && totalNetWeight !== '' ? parseFloat(totalNetWeight) : null,
            total_no_of_boxes: totalNumBoxes != null && totalNumBoxes !== '' ? parseFloat(totalNumBoxes) : null,
            total_gross_weight: totalGrossWeight != null && totalGrossWeight !== '' ? parseFloat(totalGrossWeight) : null
        };

        await order.update(updateData, { transaction: t });

        if (products && products.length > 0) {
            // Get existing order items to restore inventory
            const existingOrderItems = await OrderItem.findAll({
                where: { order_id: order.order_id },
                transaction: t
            });
            
            // Restore inventory for existing items
            await restoreInventory(existingOrderItems, t);
            
            await OrderItem.destroy({
                where: { order_id: order.order_id }
            }, { transaction: t });

            const productIds = products
                .map(product => product.productId)
                .filter(productId => productId !== null && productId !== undefined);
            
            const productMap = {};
            if (productIds.length > 0) {
                const productRecords = await Product.findAll({
                    where: {
                        pid: productIds
                    }
                });
                
                productRecords.forEach(product => {
                    productMap[product.pid] = product;
                });
            }
            
            const orderItems = products.map((product) => {
                const productDetails = productMap[product.productId];
                
                const netWeight = parseFloat(product.netWeight) || 0;
                
                let totalPrice = 0;
                if (productDetails) {
                    const marketPrice = parseFloat(productDetails.current_price) || 0;
                    totalPrice = netWeight * marketPrice;
                }
                
                // For local orders without detailed info, store only product and net weight
                const hasDetailedInfo = product.numBoxes || product.packingType || product.grossWeight || product.boxWeight;
                
                return {
                    order_id: order.order_id,
                    product_id: product.productId || null,
                    product_name: productDetails ? productDetails.product_name : null,
                    market_price: productDetails ? productDetails.current_price : 0.00,
                    total_price: totalPrice,
                    num_boxes: hasDetailedInfo ? product.numBoxes : null,
                    packing_type: hasDetailedInfo ? product.packingType : null,
                    net_weight: product.netWeight,
                    gross_weight: hasDetailedInfo ? product.grossWeight : null,
                    box_weight: hasDetailedInfo ? product.boxWeight : null
                };
            });

            await OrderItem.bulkCreate(orderItems, { transaction: t });
            
            // Reduce inventory for new order items
            await reduceInventory(orderItems, t);
        }

        await t.commit();

        const fullOrder = await Order.findByPk(order.oid, {
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['pid', 'product_name', 'current_price', 'unit']
                }]
            }]
        });

        const transformedOrder = transformOrder(fullOrder);

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: transformedOrder
        });
    } catch (error) {
        await t.rollback();
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        });
    }
};

// Delete order
const deleteOrder = async (req, res) => {
    const validationErrors = handleValidationErrors(req, res, () => {});
    if (validationErrors && validationErrors.statusCode) {
        return validationErrors;
    }

    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id, { transaction: t });
        if (!order) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Delete related order assignments first
        const { OrderAssignment } = require('../model/associations');
        await OrderAssignment.destroy({
            where: { order_id: id }
        }, { transaction: t });

        await OrderItem.destroy({
            where: { order_id: id }
        }, { transaction: t });

        await order.destroy({ transaction: t });

        await t.commit();

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete order',
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    generateOrderId
};