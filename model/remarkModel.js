const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Driver = require('./driverModel');

const Remark = sequelize.define('Remark', {
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
    vehicle_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Remarks or notes about the driver/vehicle'
    }
}, {
    tableName: 'driver_remarks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define associations
Remark.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
});

Driver.hasMany(Remark, {
    foreignKey: 'driver_id',
    as: 'remarks'
});

module.exports = Remark;