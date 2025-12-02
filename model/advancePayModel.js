const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Driver = require('./driverModel');

const AdvancePay = sequelize.define('AdvancePay', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'drivers',
            key: 'did'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    advance_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Advance payment amount in rupees'
    }
}, {
    tableName: 'driver_advancepay',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define associations
AdvancePay.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
});

Driver.hasMany(AdvancePay, {
    foreignKey: 'driver_id',
    as: 'advancePayments'
});

module.exports = AdvancePay;