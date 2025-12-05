const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LabourAttendance = sequelize.define('LabourAttendance', {
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
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('Present', 'Absent', 'Half Day'),
        allowNull: false,
        defaultValue: 'Present'
    },
    check_in_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    check_out_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    work_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: 'labour_attendance',
    timestamps: true,
});

module.exports = LabourAttendance;
