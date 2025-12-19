const { Order, OrderItem, Product } = require('../model/associations');
const { sequelize } = require('../config/db');
const { handleValidationErrors } = require('../validator/orderValidator');

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
            phoneNumber,
            email,
            alternateContact,
            deliveryAddress,
            neededByDate,
            preferredTime,
            priority,
            products
        } = req.body;

        const orderData = {
            customer_name: customerName,
            phone_number: phoneNumber,
            email: email,
            alternate_contact: alternateContact,
            delivery_address: deliveryAddress,
            needed_by_date: neededByDate,
            preferred_time: preferredTime,
            priority: priority
        };

        if (customerId !== undefined && customerId !== null) {
            orderData.customer_id = customerId;
        }

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
                
                return {
                    order_id: order.oid,
                    product_id: product.productId || null,
                    product_name: productDetails ? productDetails.product_name : null,
                    market_price: productDetails ? productDetails.current_price : 0.00,
                    total_price: totalPrice,
                    num_boxes: product.numBoxes,
                    packing_type: product.packingType,
                    net_weight: product.netWeight,
                    gross_weight: product.grossWeight,
                    box_weight: product.boxWeight
                };
            });

            await OrderItem.bulkCreate(orderItems, { transaction: t });
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
            phoneNumber,
            email,
            alternateContact,
            deliveryAddress,
            neededByDate,
            preferredTime,
            priority,
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
            phone_number: phoneNumber,
            email: email,
            alternate_contact: alternateContact,
            delivery_address: deliveryAddress,
            needed_by_date: neededByDate,
            preferred_time: preferredTime,
            priority: priority
        };

        if (customerId !== undefined && customerId !== null) {
            updateData.customer_id = customerId;
        }

        await order.update(updateData, { transaction: t });

        if (products && products.length > 0) {
            await OrderItem.destroy({
                where: { order_id: id }
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
                
                return {
                    order_id: id,
                    product_id: product.productId || null,
                    product_name: productDetails ? productDetails.product_name : null,
                    market_price: productDetails ? productDetails.current_price : 0.00,
                    total_price: totalPrice,
                    num_boxes: product.numBoxes,
                    packing_type: product.packingType,
                    net_weight: product.netWeight,
                    gross_weight: product.grossWeight,
                    box_weight: product.boxWeight
                };
            });

            await OrderItem.bulkCreate(orderItems, { transaction: t });
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
    deleteOrder
};