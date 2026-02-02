const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Order = require('./orderModel');

const FlowerOrderAssignment = sequelize.define('FlowerOrderAssignment', {
    flower_assignment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        references: {
            model: Order,
            key: 'oid'
        }
    },
    order_auto_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    order_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'e.g. FLOWER ORDER'
    },
    collection_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Box or Bag'
    },

    // Stage 1: Product Collection
    stage1_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    product_assignments: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Product assignment form entries'
    },
    stage1_summary_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 1 summary grouped by drivers'
    },
    delivery_routes: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Delivery routes with driver assignments'
    },

    // Stage 2: Packaging
    stage2_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    stage2_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 2 packaging data'
    },
    stage2_summary_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 2 summary grouped by labours'
    },

    // Stage 3: Airport Delivery
    stage3_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    stage3_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 3 airport delivery data'
    },
    stage3_summary_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 3 summary grouped by drivers'
    },

    // Stage 4: Review
    stage4_status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending'
    },
    stage4_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stage 4 review data'
    }
}, {
    tableName: 'flower_order_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = FlowerOrderAssignment;
