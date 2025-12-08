const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
    oid: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    alternate_contact: {
        type: DataTypes.STRING,
        allowNull: true
    },
    delivery_address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    needed_by_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    preferred_time: {
        type: DataTypes.ENUM('morning', 'afternoon', 'evening'),
        allowNull: true
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Normal', 'High', 'Urgent'),
        defaultValue: 'Normal'
    },
    order_status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'orders',
    timestamps: true,
});

Order.beforeCreate(async (order) => {
    try {
        // Find last order
        const lastOrder = await Order.findOne({
            order: [['createdAt', 'DESC']],
            attributes: ['oid']
        });

        let nextNumber = 1;

        if (lastOrder && lastOrder.oid) {
            const match = lastOrder.oid.match(/ORD-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        // Generate new order ID
        order.oid = `ORD-${nextNumber.toString().padStart(3, '0')}`;

    } catch (err) {
        console.error("Order ID generation failed:", err);
        order.oid = "ORD-001"; // fallback
    }
});

// Add a hook to generate customer_id before creating an order
Order.beforeCreate(async (order, options) => {
    // Only generate customer_id if it's not provided or is null/undefined
    if (!order.customer_id || order.customer_id === null || order.customer_id === undefined) {
        try {
            // Find the last order with a customer_id to determine the next number
            const lastOrder = await Order.findOne({
                where: {
                    customer_id: {
                        [Op.not]: null
                    }
                },
                order: [['createdAt', 'DESC']],
                attributes: ['customer_id']
            });

            let nextNumber = 1;
            if (lastOrder && lastOrder.customer_id) {
                // Extract the number from the last customer_id (e.g., "CLI-05" -> 5)
                const matches = lastOrder.customer_id.match(/CLI-(\d+)/);
                if (matches && matches[1]) {
                    const lastNumber = parseInt(matches[1]);
                    if (!isNaN(lastNumber)) {
                        nextNumber = lastNumber + 1;
                    }
                }
            }

            // Format the customer_id as "CLI-01", "CLI-02", etc.
            order.customer_id = `CLI-${nextNumber.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error generating customer_id:', error);
            // Fallback to a default customer_id if there's an error
            order.customer_id = `CLI-01`;
        }
    }
});

module.exports = Order;