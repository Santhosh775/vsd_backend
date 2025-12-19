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
        allowNull: false,
        defaultValue: 'Box'
    },
    
    // Product assignments - Store as form entries
    product_assignments: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Direct storage of product assignment form entries'
    },
    
    // Stage 1 Summary Data - Grouped by Driver with Assignment Details
    stage1_summary_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 1 assignment summary grouped by drivers with complete assignment details'
    },
    
    // Keep for backward compatibility
    item_assignments: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Legacy item assignments structure'
    },
    
    // Delivery routes
    delivery_routes: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of delivery routes with driver assignments'
    },
    
    // Stage 2: Packaging & Quality Check
    stage2_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    stage2_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 2 packaging data with labour assignments, wastage, and reuse tracking'
    },
    stage2_summary_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 2 assignment summary grouped by labours with complete assignment details'
    },
    
    // Stage 3: Airport Delivery
    airport_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'airports',
            key: 'aid'
        }
    },
    airport_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Driver,
            key: 'did'
        }
    },
    stage3_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    stage3_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 3 airport delivery data with CT, packages, and driver assignments'
    },
    stage3_summary_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 3 assignment summary grouped by drivers with complete delivery details'
    },
    
}, {
    tableName: 'order_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});



module.exports = OrderAssignment;