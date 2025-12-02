const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Driver = require('./driverModel');

const ExcessKM = sequelize.define('ExcessKM', {
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
    start_km: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Starting odometer reading in kilometers'
    },
    end_km: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Ending odometer reading in kilometers'
    },
    kilometers: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total kilometers (end_km - start_km)'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Amount charged for excess kilometers'
    }
}, {
    tableName: 'driver_excesskm',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define associations
ExcessKM.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
});

Driver.hasMany(ExcessKM, {
    foreignKey: 'driver_id',
    as: 'excessKMs'
});

module.exports = ExcessKM;