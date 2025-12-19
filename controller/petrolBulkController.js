const PetrolBulk = require('../model/petrolBulkModel');

// Get all petrol bulks with pagination
const getAllPetrolBulks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const whereClause = search ? {
            [require('sequelize').Op.or]: [
                { name: { [require('sequelize').Op.like]: `%${search}%` } },
                { location: { [require('sequelize').Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await PetrolBulk.findAndCountAll({
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
            message: 'Failed to fetch petrol bulks',
            error: error.message
        });
    }
};

// Get petrol bulk by ID
const getPetrolBulkById = async (req, res) => {
    try {
        const { id } = req.params;
        const petrolBulk = await PetrolBulk.findByPk(id);

        if (!petrolBulk) {
            return res.status(404).json({
                success: false,
                message: 'Petrol bulk not found'
            });
        }

        res.status(200).json({
            success: true,
            data: petrolBulk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch petrol bulk',
            error: error.message
        });
    }
};

// Create new petrol bulk
const createPetrolBulk = async (req, res) => {
    try {
        const { name, location, status } = req.body;

        const petrolBulk = await PetrolBulk.create({
            name,
            location,
            status: status || 'Active'
        });

        res.status(201).json({
            success: true,
            message: 'Petrol bulk created successfully',
            data: petrolBulk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create petrol bulk',
            error: error.message
        });
    }
};

// Update petrol bulk
const updatePetrolBulk = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, status } = req.body;

        const petrolBulk = await PetrolBulk.findByPk(id);
        if (!petrolBulk) {
            return res.status(404).json({
                success: false,
                message: 'Petrol bulk not found'
            });
        }

        await petrolBulk.update({
            name,
            location,
            status
        });

        res.status(200).json({
            success: true,
            message: 'Petrol bulk updated successfully',
            data: petrolBulk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update petrol bulk',
            error: error.message
        });
    }
};

// Delete petrol bulk
const deletePetrolBulk = async (req, res) => {
    try {
        const { id } = req.params;

        const petrolBulk = await PetrolBulk.findByPk(id);
        if (!petrolBulk) {
            return res.status(404).json({
                success: false,
                message: 'Petrol bulk not found'
            });
        }

        await petrolBulk.destroy();

        res.status(200).json({
            success: true,
            message: 'Petrol bulk deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete petrol bulk',
            error: error.message
        });
    }
};

module.exports = {
    getAllPetrolBulks,
    getPetrolBulkById,
    createPetrolBulk,
    updatePetrolBulk,
    deletePetrolBulk
};