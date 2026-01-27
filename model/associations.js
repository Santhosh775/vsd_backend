const Inventory = require('./inventoryModel');
const InventoryCompany = require('./inventoryCompanyModel');
const InventoryStock = require('./inventoryStockModel');
const Order = require('./orderModel');
const OrderItem = require('./orderItemModel');
const OrderAssignment = require('./orderAssignmentModel');
const Product = require('./productModel');
const PreOrder = require('./preOrderModel');
const Stock = require('./stockModel');
const Category = require('./categoryModel');
const Driver = require('./driverModel');
const DriverAdvancePay = require('./advancePayModel');
const DriverAttendanceHistory = require('./driverAttendanceModel');
const DriverFuelExpenses = require('./fuelExpenseModel');
const DriverRemarks = require('./remarkModel');
const DriverRate = require('./driverRateModel');
const Farmer = require('./farmerModel');
const Supplier = require('./supplierModel');
const ThirdParty = require('./thirdPartyModel');
const Labour = require('./labourModel');
const LabourAttendance = require('./labourAttendanceModel');
const LabourRate = require('./labourRateModel');
const LabourExcessPay = require('./labourExcessPayModel');
const ExcessKM = require('./excessKmModel');
const LocalOrder = require('./LocalOrder');
const Customer = require('./customerModel');
const CustomerProductPreference = require('./customerProductPreferenceModel');
const PetrolBulk = require('./petrolBulkModel');
const Admin = require('./adminModel');
const RolesPermission = require('./rolesPermissionModel');

// Inventory-InventoryStock associations
Inventory.hasMany(InventoryStock, {
    foreignKey: 'inventory_id',
    as: 'stocks'
});

InventoryStock.belongsTo(Inventory, {
    foreignKey: 'inventory_id',
    as: 'inventory'
});

// InventoryCompany-InventoryStock associations
InventoryCompany.hasMany(InventoryStock, {
    foreignKey: 'company_id',
    as: 'stocks'
});

InventoryStock.belongsTo(InventoryCompany, {
    foreignKey: 'company_id',
    as: 'company'
});

// Category-Product associations
Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
});

Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
});

// Order associations
Order.hasMany(OrderItem, {
    foreignKey: 'order_id',
    sourceKey: 'order_id',
    as: 'items'
});

OrderItem.belongsTo(Order, {
    foreignKey: 'order_id',
    targetKey: 'order_id',
    as: 'order'
});

OrderItem.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

Product.hasMany(OrderItem, {
    foreignKey: 'product_id',
    as: 'orderItems'
});

// PreOrder associations
Order.hasMany(PreOrder, {
    foreignKey: 'order_id',
    sourceKey: 'order_id',
    as: 'preOrders'
});

PreOrder.belongsTo(Order, {
    foreignKey: 'order_id',
    targetKey: 'order_id',
    as: 'order'
});

// OrderAssignment associations
OrderAssignment.belongsTo(Order, {
    foreignKey: 'order_id',
    targetKey: 'order_id',
    as: 'order'
});

Order.hasOne(OrderAssignment, {
    foreignKey: 'order_id',
    sourceKey: 'order_id',
    as: 'assignment'
});

OrderAssignment.belongsTo(Driver, {
    foreignKey: 'airport_driver_id',
    as: 'airportDriver'
});

Driver.hasMany(OrderAssignment, {
    foreignKey: 'airport_driver_id',
    as: 'assignments'
});

// LocalOrder-Driver associations
LocalOrder.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
});

Driver.hasMany(LocalOrder, {
    foreignKey: 'driver_id',
    as: 'localOrders'
});

// Driver related tables associations
Driver.hasMany(DriverAdvancePay, {
    foreignKey: 'driver_id',
    as: 'advancePayments'
});

DriverAdvancePay.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'advancePayDriver'
});

Driver.hasMany(DriverAttendanceHistory, {
    foreignKey: 'driver_id',
    as: 'attendanceHistory'
});

DriverAttendanceHistory.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
});


Driver.hasMany(DriverFuelExpenses, {
    foreignKey: 'driver_id',
    as: 'fuelExpenses'
});

DriverFuelExpenses.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'driver'
});

// Driver-ExcessKM (Start/End KM) associations
Driver.hasMany(ExcessKM, {
    foreignKey: 'driver_id',
    sourceKey: 'did',
    as: 'excessKms'
});

ExcessKM.belongsTo(Driver, {
    foreignKey: 'driver_id',
    targetKey: 'did',
    as: 'driver'
});

// PetrolBulk-DriverFuelExpenses associations
PetrolBulk.hasMany(DriverFuelExpenses, {
    foreignKey: 'pbid',
    as: 'fuelExpenses'
});

DriverFuelExpenses.belongsTo(PetrolBulk, {
    foreignKey: 'pbid',
    as: 'petrolBunk'
});

Driver.hasMany(DriverRemarks, {
    foreignKey: 'driver_id',
    as: 'remarks'
});

DriverRemarks.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'remarkDriver'
});

// Driver-DriverRate associations (based on delivery_type)
Driver.belongsTo(DriverRate, {
    foreignKey: 'delivery_type',
    targetKey: 'deliveryType',
    constraints: false,
    as: 'rateInfo'
});

DriverRate.hasMany(Driver, {
    foreignKey: 'delivery_type',
    sourceKey: 'deliveryType',
    constraints: false,
    as: 'drivers'
});

// LocalOrder associations
LocalOrder.belongsTo(Order, {
    foreignKey: 'order_id',
    targetKey: 'order_id',
    as: 'order'
});

Order.hasOne(LocalOrder, {
    foreignKey: 'order_id',
    sourceKey: 'order_id',
    as: 'localOrder'
});

// Customer-CustomerProductPreference associations
Customer.hasMany(CustomerProductPreference, {
    foreignKey: 'customer_id',
    as: 'preferences'
});

CustomerProductPreference.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});

// Product-CustomerProductPreference associations
Product.hasMany(CustomerProductPreference, {
    foreignKey: 'product_id',
    as: 'customerPreferences'
});

CustomerProductPreference.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

// Labour-LabourAttendance associations
Labour.hasMany(LabourAttendance, {
    foreignKey: 'labour_id',
    sourceKey: 'lid',
    as: 'attendanceRecords'
});

LabourAttendance.belongsTo(Labour, {
    foreignKey: 'labour_id',
    targetKey: 'lid',
    as: 'labour'
});

// Labour-LabourExcessPay associations
Labour.hasMany(LabourExcessPay, {
    foreignKey: 'labour_id',
    sourceKey: 'lid',
    as: 'excessPayments'
});

LabourExcessPay.belongsTo(Labour, {
    foreignKey: 'labour_id',
    targetKey: 'lid',
    as: 'labour'
});

// Labour-LabourRate associations (based on work_type)
Labour.belongsTo(LabourRate, {
    foreignKey: 'work_type',
    targetKey: 'labourType',
    constraints: false,
    as: 'rateInfo'
});

LabourRate.hasMany(Labour, {
    foreignKey: 'work_type',
    sourceKey: 'labourType',
    constraints: false,
    as: 'labours'
});

// Admin-RolesPermission associations
Admin.hasOne(RolesPermission, {
    foreignKey: 'aid',
    sourceKey: 'aid',
    as: 'permissions'
});

RolesPermission.belongsTo(Admin, {
    foreignKey: 'aid',
    targetKey: 'aid',
    as: 'admin'
});

module.exports = {
    Inventory,
    InventoryCompany,
    InventoryStock,
    Order,
    OrderItem,
    OrderAssignment,
    Product,
    PreOrder,
    Stock,
    Category,
    Driver,
    DriverAdvancePay,
    DriverAttendanceHistory,
    DriverFuelExpenses,
    DriverRemarks,
    DriverRate,
    Farmer,
    Supplier,
    ThirdParty,
    Labour,
    LabourAttendance,
    LabourRate,
    LabourExcessPay,
    ExcessKM,
    LocalOrder,
    Customer,
    CustomerProductPreference,
    PetrolBulk,
    Admin,
    RolesPermission
};