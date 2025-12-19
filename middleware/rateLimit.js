const rateLimit = require("express-rate-limit");

// Global Limit 
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, 
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict Login Limit 
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // Increased to 5 minutes
    max: 10, // Increased from 5 to 10
    message: "Too many login attempts. Please try again after 5 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    loginLimiter
};
