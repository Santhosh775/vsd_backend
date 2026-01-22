const Airport = require('../model/airportModel');
const { Op } = require('sequelize');

exports.createAirport = async (req, res) => {
    try {
        const { name, code, city, amount, status } = req.body;

        const existingAirport = await Airport.findOne({ where: { code } });
        if (existingAirport) {
            return res.status(400).json({
                success: false,
                message: 'Airport code already exists'
            });
        }

        const airport = await Airport.create({ name, code, city, status: status || 'Active' });

        res.status(201).json({
            success: true,
            message: 'Airport created successfully',
            data: airport
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating airport',
            error: error.message
        });
    }
};

exports.getAllAirports = async (req, res) => {
    try {
        const airports = await Airport.findAll();

        res.status(200).json({
            success: true,
            message: 'Airports retrieved successfully',
            data: airports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving airports',
            error: error.message
        });
    }
};

exports.getAirportById = async (req, res) => {
    try {
        const airport = await Airport.findByPk(req.params.id);

        if (!airport) {
            return res.status(404).json({
                success: false,
                message: 'Airport not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Airport retrieved successfully',
            data: airport
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving airport',
            error: error.message
        });
    }
};

exports.updateAirport = async (req, res) => {
    try {
        const airport = await Airport.findByPk(req.params.id);

        if (!airport) {
            return res.status(404).json({
                success: false,
                message: 'Airport not found'
            });
        }

        if (req.body.code && req.body.code !== airport.code) {
            const existingAirport = await Airport.findOne({ where: { code: req.body.code } });
            if (existingAirport) {
                return res.status(400).json({
                    success: false,
                    message: 'Airport code already exists'
                });
            }
        }

        await airport.update(req.body);

        res.status(200).json({
            success: true,
            message: 'Airport updated successfully',
            data: airport
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating airport',
            error: error.message
        });
    }
};

exports.deleteAirport = async (req, res) => {
    try {
        const airport = await Airport.findByPk(req.params.id);

        if (!airport) {
            return res.status(404).json({
                success: false,
                message: 'Airport not found'
            });
        }

        await airport.destroy();

        res.status(200).json({
            success: true,
            message: 'Airport deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting airport',
            error: error.message
        });
    }
};

exports.searchAirports = async (req, res) => {
    try {
        const { query } = req.query;

        const airports = await Airport.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { code: { [Op.like]: `%${query}%` } },
                    { city: { [Op.like]: `%${query}%` } },

                ]
            }
        });

        res.status(200).json({
            success: true,
            message: 'Airports searched successfully',
            data: airports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching airports',
            error: error.message
        });
    }
};
