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
    dashboard_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    dashboard_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    dashboard_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    dashboard_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    vendors_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    farmers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    drivers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    suppliers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    thirdparty_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    thirdparty_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    thirdparty_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    thirdparty_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    labour_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    addproduct_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    addproduct_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    addproduct_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    addproduct_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    orders_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    orders_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    orders_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    orders_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    orderassign_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    orderassign_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    orderassign_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    orderassign_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    stockmanagement_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    stockmanagement_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    stockmanagement_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    stockmanagement_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    payouts_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    reports_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    rolesandpermission_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    rolesandpermission_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    rolesandpermission_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    rolesandpermission_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    notification_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    notification_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    notification_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    notification_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    settings_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_delete: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'roles_permissions',
    timestamps: true,
});

module.exports = RolesPermission;
