const ExcessKM = require('../model/excessKmModel');
const Driver = require('../model/driverModel');
const { Op } = require('sequelize');

// Create Start/End KM record
exports.createExcessKM = async (req, res) => {
    try {
        const { driver_id, date, start_km, end_km, kilometers, amount } = req.body;

        // Auto-calculate kilometers if not provided
        const totalKilometers = kilometers !== undefined && kilometers !== null
            ? kilometers
            : (parseFloat(end_km) - parseFloat(start_km));

        const record = await ExcessKM.create({
            driver_id,
            date,
            start_km,
            end_km,
            kilometers: totalKilometers,
            amount
        });

        const data = await ExcessKM.findByPk(record.id, {
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'vehicle_number']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Start / End KM record created successfully',
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating Start / End KM record',
            error: error.message
        });
    }
};

// Get all Start/End KM records
exports.getAllExcessKMs = async (req, res) => {
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
        } else if (start_date) {
            whereClause.date = {
                [Op.gte]: start_date
            };
        } else if (end_date) {
            whereClause.date = {
                [Op.lte]: end_date
            };
        }

        const records = await ExcessKM.findAll({
            where: whereClause,
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'vehicle_number']
            }],
            order: [['date', 'DESC'], ['id', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Start / End KM records retrieved successfully',
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving Start / End KM records',
            error: error.message
        });
    }
};

// Get Start/End KM records by driver ID
exports.getExcessKMsByDriverId = async (req, res) => {
    try {
        const { driverId } = req.params;

        const records = await ExcessKM.findAll({
            where: { driver_id: driverId },
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'vehicle_number']
            }],
            order: [['date', 'DESC'], ['id', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Start / End KM records retrieved successfully',
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving Start / End KM records by driver',
            error: error.message
        });
    }
};

// Get Start/End KM record by ID
exports.getExcessKMById = async (req, res) => {
    try {
        const record = await ExcessKM.findByPk(req.params.id, {
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'vehicle_number']
            }]
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Start / End KM record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Start / End KM record retrieved successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving Start / End KM record',
            error: error.message
        });
    }
};

// Update Start/End KM record
exports.updateExcessKM = async (req, res) => {
    try {
        const record = await ExcessKM.findByPk(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Start / End KM record not found'
            });
        }

        const updates = { ...req.body };

        // Recalculate kilometers if start_km or end_km changed and kilometers not explicitly provided
        if ((updates.start_km !== undefined || updates.end_km !== undefined) && updates.kilometers === undefined) {
            const start_km = updates.start_km !== undefined ? updates.start_km : record.start_km;
            const end_km = updates.end_km !== undefined ? updates.end_km : record.end_km;
            updates.kilometers = parseFloat(end_km) - parseFloat(start_km);
        }

        await record.update(updates);

        const data = await ExcessKM.findByPk(record.id, {
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'vehicle_number']
            }]
        });

        res.status(200).json({
            success: true,
            message: 'Start / End KM record updated successfully',
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating Start / End KM record',
            error: error.message
        });
    }
};

// Delete Start/End KM record
exports.deleteExcessKM = async (req, res) => {
    try {
        const record = await ExcessKM.findByPk(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Start / End KM record not found'
            });
        }

        await record.destroy();

        res.status(200).json({
            success: true,
            message: 'Start / End KM record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting Start / End KM record',
            error: error.message
        });
    }
};

