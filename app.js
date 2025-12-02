const express = require('express');
const app = express();
const {connectDB, sequelize} = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();
const {globalLimiter} = require('./middleware/rateLimit');
const cors = require('cors');
// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(globalLimiter);

app.use(cors(
    {
        origin: 'http://localhost:5173',
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
const advancePayRoute = require('./router/advancePayRoute');
const driverAttendance = require('./router/driverAttendanceRoute');
const excessKM = require('./router/excessKmRoute');
const fuelExpense = require('./router/fuelexpenseRoute');
const remark = require('./router/remarkRoute');

// app.use('/api/v1', (req, res) => {
//     res.send('API is working');
// });
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/category', categoryRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/farmer', farmerRoute);
app.use('/api/v1/supplier', supplierRoute);
app.use('/api/v1/thirdparty', thirdPartyRoute);
app.use('/api/v1/vendor', vendorRoute);
app.use('/api/v1/driver', driverRoute);
app.use('/api/v1/labour', labourRoute);
app.use('/api/v1/advance-pay', advancePayRoute);
app.use('/api/v1/driver-attendance', driverAttendance);
app.use('/api/v1/excess-km', excessKM);
app.use('/api/v1/fuel-expense', fuelExpense);
app.use('/api/v1/remark', remark);

// start server
app.listen(process.env.SERVER_PORT, () => console.log(`🚀 Server running on port ${process.env.SERVER_PORT}`));