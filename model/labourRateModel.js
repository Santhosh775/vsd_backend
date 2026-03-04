const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LabourRate = sequelize.define('LabourRate', {
    lrid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    labourType: {
        type: DataTypes.ENUM('Normal', 'Medium', 'Heavy'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active'
    }
}, {
    tableName: 'labourratemanagement',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = LabourRate;
