const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VegetableAvailability = sequelize.define('VegetableAvailability', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  farmer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  farmer_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  vegetable_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  from_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  to_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Available', 'Unavailable'),
    defaultValue: 'Available'
  },
  vegetable_history: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of { vegetable_name, from_date, to_date } for history of changes'
  }
}, {
  tableName: 'vegetable_availability',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = VegetableAvailability;
