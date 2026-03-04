const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CustomerProductPreference = sequelize.define('CustomerProductPreference', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'customers',
            key: 'customer_id'
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'products',
            key: 'pid'
        }
    },
    multiple_product_box_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'multiple_product_boxes',
            key: 'id'
        }
    },
    item_type: {
        type: DataTypes.ENUM('product', 'multiple_product_box'),
        allowNull: false,
        defaultValue: 'product'
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    display_order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'customer_product_preferences',
    timestamps: true
});

module.exports = CustomerProductPreference;
