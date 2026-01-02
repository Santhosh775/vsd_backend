const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InventoryCompany = sequelize.define('InventoryCompany', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    payment_status: {
        type: DataTypes.ENUM('paid', 'unpaid'),
        defaultValue: 'unpaid'
    },
    paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    }
}, {
    tableName: 'inventory_companies',
    timestamps: true
});

module.exports = InventoryCompany;
