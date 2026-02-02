const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DailyPayout = sequelize.define('DailyPayout', {
    dpid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payout_type: {
        type: DataTypes.ENUM('driver', 'labour', 'farmer', 'supplier', 'third_party'),
        allowNull: false,
        comment: 'driver | labour | farmer | supplier | third_party'
    },
    reference_key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Unique row key: date for driver, date_labourId for labour, orderId_entityId for farmer/supplier/third_party'
    },
    entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Driver/Labour/Farmer/Supplier/ThirdParty ID'
    },
    reference_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Work date or order date'
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid'),
        allowNull: false,
        defaultValue: 'paid',
        comment: 'Stored when user clicks Pay'
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When marked as paid'
    },
    row_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Full table row from frontend (basePay, fuelExpenses, totalPayout, etc.)'
    }
}, {
    tableName: 'daily_payouts',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['payout_type', 'reference_key'] },
        { fields: ['payout_type'] },
        { fields: ['entity_id', 'payout_type'] },
        { fields: ['reference_date'] }
    ]
});

module.exports = DailyPayout;
