const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Product = require('./productModel');

const OrderItem = sequelize.define('OrderItem', {
    oiid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'products',
            key: 'pid'
        }
    },
    product_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    num_boxes: {
        type: DataTypes.STRING,
        allowNull: true
    },
    packing_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    net_weight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gross_weight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    box_weight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    market_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'order_items',
    timestamps: true,
});

// Add a hook to populate product details before creating/updating an order item
OrderItem.addHook('beforeValidate', async (orderItem, options) => {
    // If product_id is provided, fetch product details
    if (orderItem.product_id) {
        try {
            const product = await Product.findByPk(orderItem.product_id);
            if (product) {
                // Set product_name to the actual product name
                orderItem.product_name = product.product_name;
                // Set market_price to the product's current price
                orderItem.market_price = product.current_price;
            } else {
                // If product not found, set defaults
                orderItem.product_name = orderItem.product_name || 'Unknown Product';
                orderItem.market_price = orderItem.market_price || 0;
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            // Set defaults if there's an error fetching product
            orderItem.product_name = orderItem.product_name || 'Unknown Product';
            orderItem.market_price = orderItem.market_price || 0;
        }
    }
    
    // Calculate weights based on your Excel formulas
    // Gross Weight = Net Weight + (Box Weight × Quantity)
    // Net Weight = Gross Weight - (Box Weight × Quantity)
    
    const numBoxes = parseFloat(orderItem.num_boxes) || 0;
    const boxWeight = parseFloat(orderItem.box_weight) || 0;
    const boxWeightTotal = numBoxes * boxWeight;
    
    // If we have net weight but not gross weight, calculate gross weight
    if (orderItem.net_weight && !orderItem.gross_weight) {
        const netWeight = parseFloat(orderItem.net_weight) || 0;
        orderItem.gross_weight = (netWeight + boxWeightTotal).toString();
    }
    // If we have gross weight but not net weight, calculate net weight
    else if (orderItem.gross_weight && !orderItem.net_weight) {
        const grossWeight = parseFloat(orderItem.gross_weight) || 0;
        orderItem.net_weight = (grossWeight - boxWeightTotal).toString();
    }
    
    // Calculate total price based on net_weight and market_price
    // Formula: total_price = net_weight * market_price
    if (orderItem.net_weight && orderItem.market_price) {
        const netWeight = parseFloat(orderItem.net_weight) || 0;
        const marketPrice = parseFloat(orderItem.market_price) || 0;
        
        // Calculate total price: net_weight * market_price
        orderItem.total_price = netWeight * marketPrice;
    }
});

module.exports = OrderItem;