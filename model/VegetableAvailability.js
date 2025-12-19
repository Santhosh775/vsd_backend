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
    allowNull: false,
    references: {
      model: 'farmers',
      key: 'fid'
    }
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
  }
}, {
  tableName: 'vegetable_availability',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = VegetableAvailability;
