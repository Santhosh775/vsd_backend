const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DriverRate = sequelize.define('DriverRate', {
    drid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    deliveryType: {
        type: DataTypes.ENUM('LOCAL GRADE ORDER', 'BOX ORDER', 'Both Types'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    kilometer: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active'
    }
}, {
    tableName: 'driverratemanagement',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = DriverRate;