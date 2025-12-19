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
    work_type: {
        type: DataTypes.ENUM('Normal', 'Medium', 'Heavy'),
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
        type: DataTypes.ENUM('Active', 'InActive'),
        allowNull: false,
        defaultValue: 'Active'
    },
    profile_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_holder_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bank_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    IFSC_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    branch_name: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'labours',
    timestamps: true,
});

module.exports = Labour;