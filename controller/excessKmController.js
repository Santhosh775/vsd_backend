const ExcessKM = require('../model/excessKmModel');
const Driver = require('../model/driverModel');
const { Op } = require('sequelize');

// Create a new excess KM record
exports.createExcessKM = async (req, res) => {
    try {
        // Check if driver exists
        const driver = await Driver.findByPk(req.body.driver_id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Calculate kilometers
        const kilometers = parseFloat(req.body.end_km) - parseFloat(req.body.start_km);
        
        if (kilometers < 0) {
            return res.status(400).json({
                success: false,
                message: 'End KM must be greater than Start KM'
            });
        }
        
        req.body.kilometers = kilometers.toFixed(2);
        
        const excessKM = await ExcessKM.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Excess KM record created successfully',
            data: excessKM
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating excess KM record',
            error: error.message
        });
    }
};

// Get all excess KM records
exports.getAllExcessKMs = async (req, res) => {
    try {
        const excessKMs = await ExcessKM.findAll({
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Excess KM records retrieved successfully',
            data: excessKMs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving excess KM records',
            error: error.message
        });
    }
};

// Get excess KM record by ID
exports.getExcessKMById = async (req, res) => {
    try {
        const excessKM = await ExcessKM.findByPk(req.params.id, {
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number', 'vehicle_number']
            }]
        });
        
        if (!excessKM) {
            return res.status(404).json({
                success: false,
                message: 'Excess KM record not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Excess KM record retrieved successfully',
            data: excessKM
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving excess KM record',
            error: error.message
        });
    }
};

// Get excess KM records by driver ID
exports.getExcessKMsByDriverId = async (req, res) => {
    try {
        const excessKMs = await ExcessKM.findAll({
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
            message: 'Excess KM records retrieved successfully',
            data: excessKMs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving excess KM records',
            error: error.message
        });
    }
};

// Get excess KM records by date range
exports.getExcessKMsByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const excessKMs = await ExcessKM.findAll({
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
            message: 'Excess KM records retrieved successfully',
            data: excessKMs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving excess KM records',
            error: error.message
        });
    }
};

// Update excess KM record by ID
exports.updateExcessKM = async (req, res) => {
    try {
        const excessKM = await ExcessKM.findByPk(req.params.id);
        
        if (!excessKM) {
            return res.status(404).json({
                success: false,
                message: 'Excess KM record not found'
            });
        }
        
        // If start_km or end_km is being updated, recalculate kilometers
        if (req.body.start_km || req.body.end_km) {
            const start_km = req.body.start_km || excessKM.start_km;
            const end_km = req.body.end_km || excessKM.end_km;
            const kilometers = parseFloat(end_km) - parseFloat(start_km);
            
            if (kilometers < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'End KM must be greater than Start KM'
                });
            }
            
            req.body.kilometers = kilometers.toFixed(2);
        }
        
        await excessKM.update(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Excess KM record updated successfully',
            data: excessKM
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating excess KM record',
            error: error.message
        });
    }
};

// Delete excess KM record by ID
exports.deleteExcessKM = async (req, res) => {
    try {
        const excessKM = await ExcessKM.findByPk(req.params.id);
        
        if (!excessKM) {
            return res.status(404).json({
                success: false,
                message: 'Excess KM record not found'
            });
        }
        
        await excessKM.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Excess KM record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting excess KM record',
            error: error.message
        });
    }
};

// Get excess KM statistics
exports.getExcessKMStats = async (req, res) => {
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
        
        const stats = await ExcessKM.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('kilometers')), 'total_kilometers'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
                [sequelize.fn('AVG', sequelize.col('kilometers')), 'avg_kilometers'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_records']
            ],
            raw: true
        });
        
        res.status(200).json({
            success: true,
            message: 'Excess KM statistics retrieved successfully',
            data: stats[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving excess KM statistics',
            error: error.message
        });
    }
};