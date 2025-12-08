const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Order = require('./orderModel');
const Farmer = require('./farmerModel');
const Supplier = require('./supplierModel');
const ThirdParty = require('./thirdPartyModel');
const Labour = require('./labourModel');
const Driver = require('./driverModel');

const OrderAssignment = sequelize.define('OrderAssignment', {
    assignment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Order,
            key: 'oid'
        }
    },
    // Stage 1: Product Collection
    stage1_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    collection_type: {
        type: DataTypes.ENUM('Box', 'Bag'),
        defaultValue: 'Box'
    },
    
    // Product assignments
    product_assignments: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of product assignments with farmer/supplier/thirdparty details'
    },
    
    // Delivery routes
    delivery_routes: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of delivery routes with driver assignments'
    },
    
    // Stage 2: Packaging to Airport
    stage2_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    packaging_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    packaging_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    ready_for_dispatch: {
        type: DataTypes.DATE,
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
    package_count: {
        type: DataTypes.STRING,
        allowNull: true
    },
    
    // Airport delivery
    airport_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Driver,
            key: 'did'
        }
    },
    special_instructions: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'order_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define associations
OrderAssignment.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
});

OrderAssignment.belongsTo(Driver, {
    foreignKey: 'airport_driver_id',
    as: 'airportDriver'
});

module.exports = OrderAssignment;