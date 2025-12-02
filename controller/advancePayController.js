const AdvancePay = require('../model/advancePayModel');
const Driver = require('../model/driverModel');
const { Op } = require('sequelize');

// Create a new advance payment
exports.createAdvancePay = async (req, res) => {
    try {
        // Check if driver exists
        const driver = await Driver.findByPk(req.body.driver_id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        const advancePay = await AdvancePay.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Advance payment created successfully',
            data: advancePay
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating advance payment',
            error: error.message
        });
    }
};

// Get all advance payments
exports.getAllAdvancePays = async (req, res) => {
    try {
        const advancePays = await AdvancePay.findAll({
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Advance payments retrieved successfully',
            data: advancePays
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving advance payments',
            error: error.message
        });
    }
};

// Get advance payment by ID
exports.getAdvancePayById = async (req, res) => {
    try {
        const advancePay = await AdvancePay.findByPk(req.params.id, {
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number', 'vehicle_number']
            }]
        });
        
        if (!advancePay) {
            return res.status(404).json({
                success: false,
                message: 'Advance payment not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Advance payment retrieved successfully',
            data: advancePay
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving advance payment',
            error: error.message
        });
    }
};

// Get advance payments by driver ID
exports.getAdvancePaysByDriverId = async (req, res) => {
    try {
        const advancePays = await AdvancePay.findAll({
            where: { driver_id: req.params.driver_id },
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Advance payments retrieved successfully',
            data: advancePays
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving advance payments',
            error: error.message
        });
    }
};

// Get advance payments by date range
exports.getAdvancePaysByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const advancePays = await AdvancePay.findAll({
            where: {
                date: {
                    [Op.between]: [start_date, end_date]
                }
            },
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Advance payments retrieved successfully',
            data: advancePays
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving advance payments',
            error: error.message
        });
    }
};

// Update advance payment by ID
exports.updateAdvancePay = async (req, res) => {
    try {
        const advancePay = await AdvancePay.findByPk(req.params.id);
        
        if (!advancePay) {
            return res.status(404).json({
                success: false,
                message: 'Advance payment not found'
            });
        }
        
        await advancePay.update(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Advance payment updated successfully',
            data: advancePay
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating advance payment',
            error: error.message
        });
    }
};

// Delete advance payment by ID
exports.deleteAdvancePay = async (req, res) => {
    try {
        const advancePay = await AdvancePay.findByPk(req.params.id);
        
        if (!advancePay) {
            return res.status(404).json({
                success: false,
                message: 'Advance payment not found'
            });
        }
        
        await advancePay.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Advance payment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting advance payment',
            error: error.message
        });
    }
};

// Get advance payment statistics
exports.getAdvancePayStats = async (req, res) => {
    try {
        const { driver_id, start_date, end_date } = req.query;
        
        let whereClause = {};
        
        if (driver_id) {
            whereClause.driver_id = driver_id;
        }
        
        if (start_date && end_date) {
            whereClause.date = {
                [Op.between]: [start_date, end_date]
            };
        }
        
        const stats = await AdvancePay.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('advance_amount')), 'total_advance'],
                [sequelize.fn('AVG', sequelize.col('advance_amount')), 'avg_advance'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_records']
            ],
            raw: true
        });
        
        res.status(200).json({
            success: true,
            message: 'Advance payment statistics retrieved successfully',
            data: stats[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving advance payment statistics',
            error: error.message
        });
    }
};