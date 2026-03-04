const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LabourExcessPay = sequelize.define('LabourExcessPay', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    labour_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'labours',
            key: 'lid'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    excess_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'labour_excess_pay',
    timestamps: true,
});

module.exports = LabourExcessPay;
