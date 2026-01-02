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
    item_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hsn_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    price_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    gst_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
    },
    total_with_gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    inventory_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'inventories',
            key: 'id'
        }
    }
}, {
    tableName: 'inventory_stocks',
    timestamps: true
});

module.exports = InventoryStock;
