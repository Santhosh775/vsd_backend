const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AdvancePay = sequelize.define('AdvancePay', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'drivers',
            key: 'did'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    advance_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Advance payment amount in rupees'
    }
}, {
    tableName: 'driver_advancepay',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = AdvancePay;