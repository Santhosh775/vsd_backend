const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InventoryStock = sequelize.define('InventoryStock', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_no: {
        type: DataTypes.STRING,
        allowNull: false
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'inventory_companies',
            key: 'id'
        }
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false
    },
    total_with_gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'inventory_stocks',
    timestamps: true
});

module.exports = InventoryStock;
