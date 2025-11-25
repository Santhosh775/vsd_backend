const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vendor = sequelize.define('Vendor', {
    vid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vendor_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vendor_type: {
        type: DataTypes.ENUM('farmer', 'supplier', 'thirdparty'),
        allowNull: false
    },
    registration_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    secondary_phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pin_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact_person: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tape_color: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dealing_person: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_list: {
        type: DataTypes.JSON,
        allowNull: true
    },
    performance: {
        type: DataTypes.ENUM('excellent', 'good', 'average'),
        allowNull: false,
        defaultValue: 'average'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
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
    profile_image: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'vendors',
    timestamps: true,
});

module.exports = Vendor;