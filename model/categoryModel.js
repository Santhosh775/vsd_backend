const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/db');


const Category = sequelize.define('Category', {
    cid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    categoryname: { 
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    categorydescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category_status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    tableName: 'categories',
    timestamps: true,
});

module.exports = Category;