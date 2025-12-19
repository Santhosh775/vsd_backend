const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/db');

const RolesPermission = sequelize.define('RolesPermission', {
    rpid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    aid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'admins',
            key: 'aid'
        },
        unique: true
    },
    dashboard_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    dashboard_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    dashboard_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    dashboard_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    dashboard_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    vendors_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    farmers_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    drivers_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    suppliers_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    third_party_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    labour_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    add_product_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    orders_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    orders_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    orders_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    orders_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    orders_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    order_assign_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    order_assign_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    order_assign_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    order_assign_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    order_assign_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    stock_management_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    payouts_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    reports_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    roles_and_permission_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    roles_and_permission_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    roles_and_permission_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    roles_and_permission_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    roles_and_permission_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    notification_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    notification_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    notification_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    notification_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    notification_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    settings_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_delete: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'roles_permissions',
    timestamps: true,
});

module.exports = RolesPermission;
