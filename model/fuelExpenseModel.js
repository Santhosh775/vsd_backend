const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Driver = require('./driverModel');

const FuelExpense = sequelize.define('FuelExpense', {
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
    fuel_type: {
        type: DataTypes.ENUM('Petrol', 'Diesel'),
        allowNull: false
    },
    petrol_bunk_name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the petrol bunk/station'
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per liter'
    },
    litre: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Quantity in liters'
    },
    pbid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'petrolbulkmanagement',
            key: 'pbid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total amount (unit_price * litre)'
    }
}, {
    tableName: 'driver_fuelexpenses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = FuelExpense;