const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Draft = sequelize.define('Draft', {
    did: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customer_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    alternate_contact: {
        type: DataTypes.STRING,
        allowNull: true
    },
    delivery_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    order_received_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    packing_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    packing_day: {
        type: DataTypes.STRING,
        allowNull: true
    },
    order_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'LOCAL GRADE ORDER | BOX ORDER | FLOWER ORDER'
    },
    details_comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    needed_by_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    preferred_time: {
        type: DataTypes.ENUM('morning', 'afternoon', 'evening'),
        allowNull: true
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Normal', 'High', 'Urgent'),
        defaultValue: 'Normal'
    },
    draft_data: {
        type: DataTypes.JSON,
        allowNull: false
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'drafts',
    timestamps: true,
});

Draft.beforeCreate(async (draft) => {
    try {
        // Find last draft
        const lastDraft = await Draft.findOne({
            order: [['createdAt', 'DESC']],
            attributes: ['did']
        });

        let nextNumber = 1;

        if (lastDraft && lastDraft.did) {
            const match = lastDraft.did.match(/DRAFT-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        // Generate new draft ID
        draft.did = `DRAFT-${nextNumber.toString().padStart(3, '0')}`;

    } catch (err) {
        console.error("Draft ID generation failed:", err);
        draft.did = "DRAFT-001"; // fallback
    }
});

module.exports = Draft;