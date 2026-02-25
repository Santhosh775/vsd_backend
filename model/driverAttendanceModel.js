const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Driver = require('./driverModel');

const AttendanceHistory = sequelize.define('AttendanceHistory', {
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
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    check_in_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Check-in time (HH:MM:SS format)'
    },
    check_out_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Check-out time (HH:MM:SS format)'
    },
    attendance_status: {
        type: DataTypes.ENUM('Present', 'Absent', 'informed leave', 'uninformed leave', 'leave', 'voluntary leave', 'normal absent', 'Not Marked'),
        allowNull: false,
        defaultValue: 'Not Marked'
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Any remarks or notes for the day'
    }
}, {
    tableName: 'driver_attendance_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['driver_id', 'date'],
            name: 'unique_driver_date'
        }
    ]
});

module.exports = AttendanceHistory;