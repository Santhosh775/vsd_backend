const express = require('express');
const app = express();
const {connectDB, sequelize} = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
// middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));



app.use(cors(
    {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
));
app.disable('x-powered-by');

// Import associations
require('./model/associations');

// Sync database
connectDB().then(() => {
    sequelize.sync({ alter: false }).then(() => {
        console.log('Database synced');
    }).catch((err) => {
        console.error('Error syncing database:', err);
    });
}).catch((err) => {
    console.error('Error connecting to database:', err);
});

// routes
const adminRoute = require('./router/adminRoute');
const categoryRoute = require('./router/categoryRoute');
const productRoute = require('./router/productRoute');
const farmerRoute = require('./router/farmerRoute');
const supplierRoute = require('./router/supplierRoute');
const thirdPartyRoute = require('./router/thirdPartyRoute');
const vendorRoute = require('./router/vendorRoute');
const driverRoute = require('./router/driverRoute');
const labourRoute = require('./router/labourRoute');
const labourAttendanceRoute = require('./router/labourAttendanceRoute');
const advancePayRoute = require('./router/advancePayRoute');
const driverAttendance = require('./router/driverAttendanceRoute');
const fuelExpense = require('./router/fuelexpenseRoute');
const remark = require('./router/remarkRoute');
const orderRoute = require('./router/orderRoute');
const orderAssignmentRoute = require('./router/orderAssignmentRoute');
const flowerOrderRoute = require('./router/flowerOrderRoute');
const draftRoute = require('./router/draftRoute');
const inventoryRoute = require('./router/inventoryRoute');
const inventoryCompanyRoute = require('./router/inventoryCompanyRoute');
const inventoryStockRoute = require('./router/inventoryStockRoute');
const rolesPermissionRoute = require('./router/rolesPermissionRoute');
const airportRoute = require('./router/airportRoute');
const petrolBulkRoute = require('./router/petrolBulkRoute');
const labourRateRoute = require('./router/labourRateRoute');
const driverRateRoute = require('./router/driverRateRoute');
const vegetableAvailabilityRoute = require('./router/vegetableAvailabilityRoute');
const preOrderRoute = require('./router/preOrderRoute');
const sellStockRoute = require('./router/sellStockRoute');
const localOrderRoute = require('./router/localOrderRoute');
const customerRoute = require('./router/customerRoute');
const customerProductPreferenceRoute = require('./router/customerProductPreferenceRoute');
const excessKmRoute = require('./router/excessKmRoute');
const notificationRoute = require('./router/notificationRoute');
const payoutRoute = require('./router/payoutRoute');
const dailyPayoutsRoute = require('./router/dailyPayoutsRoute');


// app.use('/api/v1', (req, res) => {
//     res.send('API is working');
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/category', categoryRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/farmer', farmerRoute);
app.use('/api/v1/supplier', supplierRoute);
app.use('/api/v1/thirdparty', thirdPartyRoute);
app.use('/api/v1/vendor', vendorRoute);
app.use('/api/v1/driver', driverRoute);
app.use('/api/v1/labour', labourRoute);
app.use('/api/v1/labour-attendance', labourAttendanceRoute);
app.use('/api/v1/advance-pay', advancePayRoute);
app.use('/api/v1/driver-attendance', driverAttendance);
app.use('/api/v1/fuel-expense', fuelExpense);
app.use('/api/v1/remark', remark);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/order-assignment', orderAssignmentRoute);
app.use('/api/v1/flower-order-assignment', flowerOrderRoute);
app.use('/api/v1/draft', draftRoute);
app.use('/api/v1/inventory', inventoryRoute);
app.use('/api/v1/inventory-company', inventoryCompanyRoute);
app.use('/api/v1/inventory-stock', inventoryStockRoute);
app.use('/api/v1/roles-permissions', rolesPermissionRoute);
app.use('/api/v1/airport', airportRoute);
app.use('/api/v1/petrol-bulk', petrolBulkRoute);
app.use('/api/v1/labour-rate', labourRateRoute);
app.use('/api/v1/driver-rate', driverRateRoute);
app.use('/api/v1/vegetable-availability', vegetableAvailabilityRoute);
app.use('/api/v1/preorders', preOrderRoute);
app.use('/api/v1/sell-stock', sellStockRoute);
app.use('/api/v1/local-order', localOrderRoute);
app.use('/api/v1/customer', customerRoute);
app.use('/api/v1/customer-product', customerProductPreferenceRoute);
app.use('/api/v1/excess-km', excessKmRoute);
app.use('/api/v1/notification', notificationRoute);
app.use('/api/v1/payout', payoutRoute);
app.use('/api/v1/daily-payouts', dailyPayoutsRoute);


// start server
app.listen(process.env.SERVER_PORT, () => console.log(`🚀 Server running on port ${process.env.SERVER_PORT}`));