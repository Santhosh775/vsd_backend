const FuelExpense = require('../model/fuelExpenseModel');
const Driver = require('../model/driverModel');
const PetrolBulk = require('../model/petrolBulkModel');
const { Op } = require('sequelize');

// Create a new fuel expense
exports.createFuelExpense = async (req, res) => {
    try {
        // Check if driver exists
        const driver = await Driver.findByPk(req.body.driver_id);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        // Calculate total amount
        const total_amount = parseFloat(req.body.unit_price) * parseFloat(req.body.litre);
        req.body.total_amount = total_amount.toFixed(2);
        
        const fuelExpense = await FuelExpense.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Fuel expense created successfully',
            data: fuelExpense
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating fuel expense',
            error: error.message
        });
    }
};

// Get all fuel expenses
exports.getAllFuelExpenses = async (req, res) => {
    try {
        const fuelExpenses = await FuelExpense.findAll({
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
                },
                {
                    model: PetrolBulk,
                    as: 'petrolBunk',
                    attributes: ['pbid', 'name', 'location']
                }
            ],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Fuel expenses retrieved successfully',
            data: fuelExpenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving fuel expenses',
            error: error.message
        });
    }
};

// Get fuel expense by ID
exports.getFuelExpenseById = async (req, res) => {
    try {
        const fuelExpense = await FuelExpense.findByPk(req.params.id, {
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['did', 'driver_id', 'driver_name', 'phone_number', 'vehicle_number']
                },
                {
                    model: PetrolBulk,
                    as: 'petrolBunk',
                    attributes: ['pbid', 'name', 'location']
                }
            ]
        });
        
        if (!fuelExpense) {
            return res.status(404).json({
                success: false,
                message: 'Fuel expense not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Fuel expense retrieved successfully',
            data: fuelExpense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving fuel expense',
            error: error.message
        });
    }
};

// Get fuel expenses by driver ID
exports.getFuelExpensesByDriverId = async (req, res) => {
    try {
        const fuelExpenses = await FuelExpense.findAll({
            where: { driver_id: req.params.driver_id },
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
                },
                {
                    model: PetrolBulk,
                    as: 'petrolBunk',
                    attributes: ['pbid', 'name', 'location']
                }
            ],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Fuel expenses retrieved successfully',
            data: fuelExpenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving fuel expenses',
            error: error.message
        });
    }
};

// Get fuel expenses by date range
exports.getFuelExpensesByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const fuelExpenses = await FuelExpense.findAll({
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
            message: 'Fuel expenses retrieved successfully',
            data: fuelExpenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving fuel expenses',
            error: error.message
        });
    }
};

// Get fuel expenses by fuel type
exports.getFuelExpensesByFuelType = async (req, res) => {
    try {
        const { fuel_type } = req.params;
        
        const fuelExpenses = await FuelExpense.findAll({
            where: { fuel_type: fuel_type },
            include: [{
                model: Driver,
                as: 'driver',
                attributes: ['did', 'driver_id', 'driver_name', 'phone_number']
            }],
            order: [['date', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            message: 'Fuel expenses retrieved successfully',
            data: fuelExpenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving fuel expenses',
            error: error.message
        });
    }
};

// Update fuel expense by ID
exports.updateFuelExpense = async (req, res) => {
    try {
        const fuelExpense = await FuelExpense.findByPk(req.params.id);
        
        if (!fuelExpense) {
            return res.status(404).json({
                success: false,
                message: 'Fuel expense not found'
            });
        }
        
        // If unit_price or litre is being updated, recalculate total_amount
        if (req.body.unit_price || req.body.litre) {
            const unit_price = req.body.unit_price || fuelExpense.unit_price;
            const litre = req.body.litre || fuelExpense.litre;
            const total_amount = parseFloat(unit_price) * parseFloat(litre);
            req.body.total_amount = total_amount.toFixed(2);
        }
        
        await fuelExpense.update(req.body);
        
        res.status(200).json({
            success: true,
            message: 'Fuel expense updated successfully',
            data: fuelExpense
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating fuel expense',
            error: error.message
        });
    }
};

// Delete fuel expense by ID
exports.deleteFuelExpense = async (req, res) => {
    try {
        const fuelExpense = await FuelExpense.findByPk(req.params.id);
        
        if (!fuelExpense) {
            return res.status(404).json({
                success: false,
                message: 'Fuel expense not found'
            });
        }
        
        await fuelExpense.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Fuel expense deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting fuel expense',
            error: error.message
        });
    }
};

// Get fuel expense statistics
exports.getFuelExpenseStats = async (req, res) => {
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
        
        const stats = await FuelExpense.findAll({
            where: whereClause,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_expense'],
                [sequelize.fn('SUM', sequelize.col('litre')), 'total_litres'],
                [sequelize.fn('AVG', sequelize.col('unit_price')), 'avg_unit_price'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_records']
            ],
            raw: true
        });
        
        res.status(200).json({
            success: true,
            message: 'Fuel expense statistics retrieved successfully',
            data: stats[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving fuel expense statistics',
            error: error.message
        });
    }
};