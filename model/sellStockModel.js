const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SellStock = sequelize.define('SellStock', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    stock_item_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    entity_type: {
        type: DataTypes.ENUM('supplier', 'thirdParty'),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    labour_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    price_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'sell_stocks',
    timestamps: true
});

module.exports = SellStock;
