const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DriverNotification = sequelize.define('DriverNotification', {
    dnid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    did: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'drivers',
            key: 'did'
        }
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'order_assigned'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reference_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Order ID or assignment ID for deep linking'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'driver_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = DriverNotification;
