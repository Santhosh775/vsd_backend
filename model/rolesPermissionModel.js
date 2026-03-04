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
    
    vendors_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendors_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    farmers_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_orderlist: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_payout: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_vegetableavailability: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    farmers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    drivers_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_attendance: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_attendance_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_startkm_endkm: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_localgradeorder: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_boxorder: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_fuelexpense: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_advancepay: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_remarks: { type: DataTypes.BOOLEAN, defaultValue: false },
    drivers_dailypayout: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    suppliers_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_orderlist: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_payout: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    suppliers_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    third_party_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_orderlist: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_payout: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    labour_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_attendance: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_attendance_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_excesspay: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_dailypayout: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    labour_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    add_product_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_add: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_view: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_allcategory: { type: DataTypes.BOOLEAN, defaultValue: false },
    add_product_customerproductorder: { type: DataTypes.BOOLEAN, defaultValue: false },
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
    stock_management_marketpriceentry: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_sellstock: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_inventorystock: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    stock_management_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    payouts_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_farmerpayout: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_supplierpayout: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_thirdpartypayout: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_driverpayout: { type: DataTypes.BOOLEAN, defaultValue: false },
    payouts_labourpayout: { type: DataTypes.BOOLEAN, defaultValue: false },

    reports_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_orderreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_flowerorderreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_farmerreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_supplierreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_thirdpartyreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_driverreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_labourreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_payoutreports: { type: DataTypes.BOOLEAN, defaultValue: false },
    reports_invoicereports: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    notification_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    settings_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_inventorymanagement: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_inventorycompany: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_airportlocation: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_petroleummanagement: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_labourrate: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_driverrate: { type: DataTypes.BOOLEAN, defaultValue: false },
    settings_customer: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName: 'roles_permissions',
    timestamps: true,
});

module.exports = RolesPermission;
