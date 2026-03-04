const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LabourRemark = sequelize.define('LabourRemark', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'labour_remarks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = LabourRemark;
