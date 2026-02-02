const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payout = sequelize.define('Payout', {
    pid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payout_type: {
        type: DataTypes.ENUM('farmer', 'supplier', 'third_party', 'labour', 'driver'),
        allowNull: false,
        comment: 'farmer | supplier | third_party | labour | driver'
    },
    reference_key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Unique row key e.g. orderId_entityId or date_entityId for labour/driver'
    },
    entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Farmer/Supplier/ThirdParty/Labour/Driver ID'
    },
    entity_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    entity_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g. FID-01, SID-01, DRV-01'
    },
    order_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Order oid when applicable'
    },
    reference_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Order date or work date'
    },
    quantity_kg: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
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
        comment: 'Stored records are paid when created via mark-paid'
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When marked as paid'
    },
    row_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Full table row as sent from frontend (all columns)'
    }
}, {
    tableName: 'payouts',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['payout_type', 'reference_key'] },
        { fields: ['payout_type'] },
        { fields: ['entity_id', 'payout_type'] },
        { fields: ['reference_date'] }
    ]
});

module.exports = Payout;
