const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Labour = sequelize.define('Labour', {
    lid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    labour_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mobile_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^[0-9]{10}$/
        }
    },
    aadhaar_number: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /^[0-9]{12}$/
        }
    },
    date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false
    },
    blood_group: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    department: {
        type: DataTypes.ENUM('Packing', 'Loading', 'Unloading'),
        allowNull: false
    },
    daily_wage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    joining_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Present', 'Absent', 'Half Day', 'Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active'
    },
    profile_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    work_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    check_in_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    check_out_time: {
        type: DataTypes.TIME,
        allowNull: true
    },
    today_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: 'labours',
    timestamps: true,
});

module.exports = Labour;