const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/db');

const Product = sequelize.define('Product', {
    pid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_short: {
        type: DataTypes.STRING,
        allowNull: true
    },
    net_weight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'cid'
        }
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    current_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    price_date: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    product_status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    },
    default_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    packing_type: {
        type: DataTypes.TEXT,
        allowNull: true
    }       
}, {
    tableName: 'products',
    timestamps: true,
});

module.exports = Product;