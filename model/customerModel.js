const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Customer = sequelize.define('Customer', {
    customer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customer_category: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'customers',
    timestamps: true
});

module.exports = Customer;
