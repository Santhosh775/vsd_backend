const rateLimit = require("express-rate-limit");

// Global Limit 
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // max requests per IP
    message: "Too many requests, please try again later.",
});

// Strict Login Limit 
const loginLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 5, // Only 5 login tries allowed
    message: "Too many login attempts. Please try again after 5 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    loginLimiter
};
