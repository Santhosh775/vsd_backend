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
const DriverExcessKm = require('./excessKmModel');
const DriverFuelExpenses = require('./excessKmModel');
const DriverRemarks = require('./remarkModel');
const Farmer = require('./farmerModel');
const Supplier = require('./supplierModel');
const ThirdParty = require('./thirdPartyModel');
const Labour = require('./labourModel');
const LocalOrder = require('./LocalOrder');

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

Driver.hasMany(DriverExcessKm, {
    foreignKey: 'driver_id',
    as: 'excessKm'
});

DriverExcessKm.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'excessKmDriver'
});

Driver.hasMany(DriverFuelExpenses, {
    foreignKey: 'driver_id',
    as: 'fuelExpenses'
});

DriverFuelExpenses.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'fuelExpenseDriver'
});

Driver.hasMany(DriverRemarks, {
    foreignKey: 'driver_id',
    as: 'remarks'
});

DriverRemarks.belongsTo(Driver, {
    foreignKey: 'driver_id',
    as: 'remarkDriver'
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
    DriverExcessKm,
    DriverFuelExpenses,
    DriverRemarks,
    Farmer,
    Supplier,
    ThirdParty,
    Labour,
    LocalOrder
};
