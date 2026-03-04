const jwt = require('jsonwebtoken');
const Admin = require('../model/adminModel');
const Driver = require('../model/driverModel');

exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if it's an admin token
        if (decoded.aid) {
            const admin = await Admin.findByPk(decoded.aid);
            if (admin) {
                req.admin = admin;
                req.user = admin;
                req.userType = 'admin';
                return next();
            }
        }
        
        // Check if it's a driver token
        if (decoded.did) {
            const driver = await Driver.findByPk(decoded.did);
            if (driver) {
                req.driver = driver;
                req.user = driver;
                req.userType = 'driver';
                return next();
            }
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid token. User not found.'
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};