const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MultipleProductBox = sequelize.define('MultipleProductBox', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    short: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_ids: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    packing_types: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    net_weights: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Object mapping product_id (string) to net weight in grams, e.g. { "1": "500", "2": "300" }'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    tableName: 'multiple_product_boxes',
    timestamps: true
});

module.exports = MultipleProductBox;

