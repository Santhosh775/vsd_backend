const { Sequelize } = require('sequelize');
require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;

// Function to create the database if it doesn't exist
async function createDBIfNotExists() {
    try {
    const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS  
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();
} catch (error) {
    console.error('Error creating database:', error);
}
}

// Database connection setup
const sequelize = new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASS,
    {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        logging: false,
        define: {
            timestamps: false
        },
        pool: {
            max: 20, // Increased from 5 to 20
            min: 2,  // Increased from 0 to 2
            acquire: 60000, // Increased from 30000 to 60000
            idle: 30000     // Increased from 10000 to 30000
        }
    }
);

// Function to test the database connection
async function connectDB() {
    await createDBIfNotExists();
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        // Remove automatic retry to prevent infinite loops
        throw error;
    }
}



module.exports = {connectDB, sequelize };