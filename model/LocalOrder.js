const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LocalOrder = sequelize.define('LocalOrder', {
    local_order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'oid'
        }
    },
    order_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'Local Grade'
    },
    product_assignments: {
        type: DataTypes.JSON,
        allowNull: true
    },
    delivery_routes: {
        type: DataTypes.JSON,
        allowNull: true
    },
    summary_data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'pending'
    }
}, {
    tableName: 'local_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = LocalOrder;
