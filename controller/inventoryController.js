const Inventory = require('../model/inventoryModel');

exports.createInventory = async (req, res) => {
    try {
        const { name, category, weight, unit, price } = req.body;
        
        const newInventory = await Inventory.create({
            name,
            category,
            weight,
            unit,
            price
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
        
        const { count, rows } = await Inventory.findAndCountAll({
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
        const { name, category, weight, unit, price } = req.body;
        
        const inventory = await Inventory.findByPk(id);
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }
        
        await inventory.update({ name, category, weight, unit, price });
        
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
