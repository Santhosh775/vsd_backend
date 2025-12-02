const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Driver = sequelize.define('Driver', {
    did: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    driver_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    driver_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false
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
    license_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    vehicle_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    available_vehicle: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Specific vehicle name/model assigned to driver'
    },
    vehicle_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    vehicle_condition: {
        type: DataTypes.ENUM('Excellent', 'Good', 'Average', 'Poor'),
        allowNull: false,
        defaultValue: 'Good'
    },
    capacity: {
        type: DataTypes.STRING,
        allowNull: false
    },
    insurance_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    insurance_expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    pollution_certificate: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Pollution certificate number'
    },
    ka_permit: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'KA permit number'
    },
    delivery_type: {
        type: DataTypes.ENUM('Local Pickups', 'Line Airport', 'Both Types'),
        allowNull: false,
    },
    driver_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    license_image: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Upload License Image'
    },
    driver_id_proof: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Upload ID Proof'
    },
    status: {
        type: DataTypes.ENUM('Available', 'On Trip', 'Break', 'Inactive'),
        allowNull: false,
        defaultValue: 'Available'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Driver Status toggle (Active/Inactive)'
    },
    login_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    logout_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    attendance_status: {
        type: DataTypes.ENUM('Present', 'Absent'),
        allowNull: false,
        defaultValue: 'Present'
    },
    working_hours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00,
        validate: {
            min: 0.00,
            max: 5.00
        }
    },
    total_deliveries: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: 'drivers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Driver;