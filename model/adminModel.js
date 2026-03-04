const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/db');

const Admin = sequelize.define('Admin', {
    aid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        },
        index: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: /^[A-Za-z0-9_-]+$/i
        },
        index: true
    },
    password: { 
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 100],
            notEmpty: true,
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'superadmin', 'supervisor', 'accountant', 'driver'),
        allowNull: false,
        defaultValue: 'admin'
    }
}, {
    tableName: 'admins',
    timestamps: true,
});

module.exports = Admin;
