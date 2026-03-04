const rateLimit = require("express-rate-limit");

// Global Limit - Disabled for development
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // Increased limit
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development' // Skip in development
});

// Strict Login Limit 
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50, // Increased limit
    message: "Too many login attempts. Please try again after 5 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    loginLimiter
};
