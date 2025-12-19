const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PreOrder = sequelize.define('PreOrder', {
    poid: {
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
    collection_type: {
        type: DataTypes.ENUM('Box', 'Bag'),
        allowNull: false,
        defaultValue: 'Box'
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
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'pre_orders',
    timestamps: true
});

module.exports = PreOrder;
