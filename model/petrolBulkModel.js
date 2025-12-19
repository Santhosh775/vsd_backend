const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PetrolBulk = sequelize.define('PetrolBulk', {
    pbid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active'
    }
}, {
    tableName: 'petrolbulkmanagement',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = PetrolBulk;