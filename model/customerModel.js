const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Customer = sequelize.define('Customer', {
    cust_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'customers',
    timestamps: true
});

module.exports = Customer;
