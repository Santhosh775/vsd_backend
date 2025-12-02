const Remark = require('../model/remarkModel');
const Driver = require('../model/driverModel');
const { Op } = require('sequelize');

// Create a new remark
exports.createRemark = async (req, res) => {
    try {
        // Check if driver exists
        const driver = await Driver.findByPk(req.body.driver_id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        const remark = await Remark.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Remark created successfully',
            data: remark
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating remark',
            error: error.message
        });
    }
};

// Get all remarks
exports.getAllRemarks = async (req, res) => {
    try {
        const remarks = await Remark.findAll({
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Remarks retrieved successfully',
            data: remarks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving remarks',
            error: error.message
        });
    }
};

// Get remark by ID
exports.getRemarkById = async (req, res) => {
    try {
        const remark = await Remark.findByPk(req.params.id, {
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number', 'vehicle_number']
            }]
        });
        
        if (!remark) {
            return res.status(404).json({
                success: false,
                message: 'Remark not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Remark retrieved successfully',
            data: remark
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving remark',
            error: error.message
        });
    }
};

// Get remarks by driver ID
exports.getRemarksByDriverId = async (req, res) => {
    try {
        const remarks = await Remark.findAll({
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
            message: 'Remarks retrieved successfully',
            data: remarks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving remarks',
            error: error.message
        });
    }
};

// Get remarks by date range
exports.getRemarksByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const remarks = await Remark.findAll({
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
            message: 'Remarks retrieved successfully',
            data: remarks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving remarks',
            error: error.message
        });
    }
};

// Search remarks by keyword
exports.searchRemarks = async (req, res) => {
    try {
        const { query } = req.query;
        
        const remarks = await Remark.findAll({
            where: {
                [Op.or]: [
                    { remarks: { [Op.like]: `%${query}%` } },
                    { vehicle_number: { [Op.like]: `%${query}%` } }
                ]
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
            message: 'Remarks searched successfully',
            data: remarks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching remarks',
            error: error.message
        });
    }
};

// Update remark by ID
exports.updateRemark = async (req, res) => {
    try {
        const remark = await Remark.findByPk(req.params.id);
        
        if (!remark) {
            return res.status(404).json({
                success: false,
                message: 'Remark not found'
            });
        }
        
        await remark.update(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Remark updated successfully',
            data: remark
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating remark',
            error: error.message
        });
    }
};

// Delete remark by ID
exports.deleteRemark = async (req, res) => {
    try {
        const remark = await Remark.findByPk(req.params.id);
        
        if (!remark) {
            return res.status(404).json({
                success: false,
                message: 'Remark not found'
            });
        }
        
        await remark.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Remark deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting remark',
            error: error.message
        });
    }
};

// Get remarks count by driver
exports.getRemarksCountByDriver = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let whereClause = {};
        
        if (start_date && end_date) {
            whereClause.date = {
                [Op.between]: [start_date, end_date]
            };
        }
        
        const remarksCount = await Remark.findAll({
            where: whereClause,
            attributes: [
                'driver_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'remarks_count']
            ],
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            group: ['driver_id'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Remarks count retrieved successfully',
            data: remarksCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving remarks count',
            error: error.message
        });
    }
};