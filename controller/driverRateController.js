const DriverRate = require('../model/driverRateModel');

const getAllDriverRates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const whereClause = search ? {
            deliveryType: { [require('sequelize').Op.like]: `%${search}%` }
        } : {};

        const { count, rows } = await DriverRate.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver rates',
            error: error.message
        });
    }
};

const getDriverRateById = async (req, res) => {
    try {
        const { id } = req.params;
        const driverRate = await DriverRate.findByPk(id);

        if (!driverRate) {
            return res.status(404).json({
                success: false,
                message: 'Driver rate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: driverRate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver rate',
            error: error.message
        });
    }
};

const createDriverRate = async (req, res) => {
    try {
        const { deliveryType, amount, status } = req.body;

        const driverRate = await DriverRate.create({
            deliveryType,
            amount,
            status: status || 'Active'
        });

        res.status(201).json({
            success: true,
            message: 'Driver rate created successfully',
            data: driverRate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create driver rate',
            error: error.message
        });
    }
};

const updateDriverRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryType, amount, status } = req.body;

        const driverRate = await DriverRate.findByPk(id);
        if (!driverRate) {
            return res.status(404).json({
                success: false,
                message: 'Driver rate not found'
            });
        }

        await driverRate.update({
            deliveryType,
            amount,
            status
        });

        res.status(200).json({
            success: true,
            message: 'Driver rate updated successfully',
            data: driverRate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update driver rate',
            error: error.message
        });
    }
};

const deleteDriverRate = async (req, res) => {
    try {
        const { id } = req.params;

        const driverRate = await DriverRate.findByPk(id);
        if (!driverRate) {
            return res.status(404).json({
                success: false,
                message: 'Driver rate not found'
            });
        }

        await driverRate.destroy();

        res.status(200).json({
            success: true,
            message: 'Driver rate deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete driver rate',
            error: error.message
        });
    }
};

module.exports = {
    getAllDriverRates,
    getDriverRateById,
    createDriverRate,
    updateDriverRate,
    deleteDriverRate
};
