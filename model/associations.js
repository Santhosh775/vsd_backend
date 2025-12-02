const Category = require('./categoryModel');
const Product = require('./productModel');
const Admin = require('./adminModel');
const Farmer = require('./farmerModel');
const Supplier = require('./supplierModel');
const ThirdParty = require('./thirdPartyModel');
const Vendor = require('./vendorModel');
const Driver = require('./driverModel');
const Labour = require('./labourModel');
const AdvancePay = require('./advancepayModel');
const driverAttendance = require('./driverAttendanceModel');
const excessKM = require('./excessKmModel');
const fuelExpense = require('./fuelExpenseModel');
const remark = require('./remarkModel')

// Category - Product relationship
Category.hasMany(Product, { 
    foreignKey: 'category_id', 
    as: 'products',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Product.belongsTo(Category, { 
    foreignKey: 'category_id', 
    as: 'category',
    allowNull: false
});

// Farmer - Product relationship (many-to-many through product_list)
// Note: This is a virtual relationship as product_list is stored as JSON in the farmer model
// We'll handle this relationship manually in the controller

// Supplier - Product relationship (many-to-many through product_list)
// Note: This is a virtual relationship as product_list is stored as JSON in the supplier model
// We'll handle this relationship manually in the controller

// ThirdParty - Product relationship (many-to-many through product_list)
// Note: This is a virtual relationship as product_list is stored as JSON in the third party model
// We'll handle this relationship manually in the controller

// Driver associations
Driver.hasMany(AdvancePay, { foreignKey: 'driver_id', as: 'advancePayments' });
AdvancePay.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

Driver.hasMany(driverAttendance, { foreignKey: 'driver_id', as: 'attendanceHistory' });
driverAttendance.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

Driver.hasMany(excessKM, { foreignKey: 'driver_id', as: 'excessKMs' });
excessKM.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

Driver.hasMany(fuelExpense, { foreignKey: 'driver_id', as: 'fuelExpenses' });
fuelExpense.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

Driver.hasMany(remark, { foreignKey: 'driver_id', as: 'remarks' });
remark.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

module.exports = {
    Category,
    Product,
    Admin,
    Farmer,
    Supplier,
    ThirdParty,
    Vendor,
    Driver,
    Labour,
    AdvancePay,
    driverAttendance,
    excessKM,
    fuelExpense,
    remark
};