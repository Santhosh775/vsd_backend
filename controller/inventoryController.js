const Inventory = require('../model/inventoryModel');
const InventoryStock = require('../model/inventoryStockModel');
const { sequelize } = require('../config/db');

exports.createInventory = async (req, res) => {
    try {
        const { name, category, weight, unit, color, quantity } = req.body;
        
        const newInventory = await Inventory.create({
            name,
            category,
            weight: category === 'Tape' ? null : (weight !== undefined && weight !== null ? weight : null),
            unit: category === 'Tape' ? null : unit,
            color: category === 'Tape' ? color : null,
            quantity: quantity !== undefined ? quantity : 0
        });
        
        res.status(201).json({
            success: true,
            message: "Inventory item created successfully",
            data: newInventory
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create inventory item",
            error: error.message 
        });
    }
};

exports.getAllInventory = async (req, res) => {
    try {
        const { page, limit, offset } = req.pagination;
        const { category } = req.query;
        
        const whereClause = {};
        if (category) {
            const categories = category.split(',');
            whereClause.category = categories;
        }
        
        const { count, rows } = await Inventory.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset
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
            message: "Failed to fetch inventory items",
            error: error.message 
        });
    }
};

exports.getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const inventory = await Inventory.findByPk(id);
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: inventory
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch inventory item",
            error: error.message 
        });
    }
};

exports.updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, weight, unit, color, quantity } = req.body;
        
        const inventory = await Inventory.findByPk(id);
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }
        
        await inventory.update({
            name,
            category,
            weight: category === 'Tape' ? null : (weight !== undefined && weight !== null ? weight : inventory.weight),
            unit: category === 'Tape' ? null : unit,
            color: category === 'Tape' ? color : null,
            quantity: quantity !== undefined ? quantity : inventory.quantity
        });
        
        res.status(200).json({
            success: true,
            message: "Inventory item updated successfully",
            data: inventory
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update inventory item",
            error: error.message 
        });
    }
};

exports.deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const inventory = await Inventory.findByPk(id);
        
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }
        
        await inventory.destroy();
        
        res.status(200).json({
            success: true,
            message: "Inventory item deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete inventory item",
            error: error.message 
        });
    }
};