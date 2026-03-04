const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductCount = sequelize.define('ProductCount', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'products',
            key: 'pid'
        }
    },
    product_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'cid'
        }
    },
    category_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'inactive'
    }
}, {
    tableName: 'product_counts',
    timestamps: true
});

module.exports = ProductCount;
