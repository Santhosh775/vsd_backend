const LabourRate = require('../model/labourRateModel');

const getAllLabourRates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const whereClause = search ? {
            labourType: { [require('sequelize').Op.like]: `%${search}%` }
        } : {};

        const { count, rows } = await LabourRate.findAndCountAll({
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
            message: 'Failed to fetch labour rates',
            error: error.message
        });
    }
};

const getLabourRateById = async (req, res) => {
    try {
        const { id } = req.params;
        const labourRate = await LabourRate.findByPk(id);

        if (!labourRate) {
            return res.status(404).json({
                success: false,
                message: 'Labour rate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: labourRate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch labour rate',
            error: error.message
        });
    }
};

const createLabourRate = async (req, res) => {
    try {
        const { labourType, amount, status } = req.body;

        const labourRate = await LabourRate.create({
            labourType,
            amount,
            status: status || 'Active'
        });

        res.status(201).json({
            success: true,
            message: 'Labour rate created successfully',
            data: labourRate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create labour rate',
            error: error.message
        });
    }
};

const updateLabourRate = async (req, res) => {
    try {
        const { id } = req.params;
        const { labourType, amount, status } = req.body;

        const labourRate = await LabourRate.findByPk(id);
        if (!labourRate) {
            return res.status(404).json({
                success: false,
                message: 'Labour rate not found'
            });
        }

        await labourRate.update({
            labourType,
            amount,
            status
        });

        res.status(200).json({
            success: true,
            message: 'Labour rate updated successfully',
            data: labourRate
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update labour rate',
            error: error.message
        });
    }
};

const deleteLabourRate = async (req, res) => {
    try {
        const { id } = req.params;

        const labourRate = await LabourRate.findByPk(id);
        if (!labourRate) {
            return res.status(404).json({
                success: false,
                message: 'Labour rate not found'
            });
        }

        await labourRate.destroy();

        res.status(200).json({
            success: true,
            message: 'Labour rate deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete labour rate',
            error: error.message
        });
    }
};

module.exports = {
    getAllLabourRates,
    getLabourRateById,
    createLabourRate,
    updateLabourRate,
    deleteLabourRate
};
