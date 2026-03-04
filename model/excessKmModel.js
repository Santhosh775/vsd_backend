const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

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
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    start_km: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    end_km: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    kilometers: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'driver_excess_km',
    timestamps: true,
});

module.exports = ExcessKM;

