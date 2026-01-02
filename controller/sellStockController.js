const SellStock = require('../model/sellStockModel');

exports.createSellStock = async (req, res) => {
    try {
        const { stockId, entityType, entityId, driverId, labourId, pricePerKg, quantity, totalAmount } = req.body;
        
        const sellStock = await SellStock.create({
            stock_id: stockId,
            entity_type: entityType,
            entity_id: entityId,
            driver_id: driverId || null,
            labour_id: labourId || null,
            price_per_kg: pricePerKg,
            quantity: quantity,
            total_amount: totalAmount
        });
        
        res.status(201).json({
            success: true,
            message: "Sell stock created successfully",
            data: sellStock
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create sell stock",
            error: error.message 
        });
    }
};

exports.getAllSellStocks = async (req, res) => {
    try {
        const sellStocks = await SellStock.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            data: sellStocks
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch sell stocks",
            error: error.message 
        });
    }
};

exports.getSellStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const sellStock = await SellStock.findByPk(id);
        
        if (!sellStock) {
            return res.status(404).json({
                success: false,
                message: "Sell stock not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: sellStock
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch sell stock",
            error: error.message 
        });
    }
};

exports.updateSellStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stockId, entityType, entityId, driverId, labourId, pricePerKg, quantity, totalAmount } = req.body;
        
        const sellStock = await SellStock.findByPk(id);
        if (!sellStock) {
            return res.status(404).json({
                success: false,
                message: "Sell stock not found"
            });
        }
        
        await sellStock.update({
            stock_id: stockId,
            entity_type: entityType,
            entity_id: entityId,
            driver_id: driverId || null,
            labour_id: labourId || null,
            price_per_kg: pricePerKg,
            quantity: quantity,
            total_amount: totalAmount
        });
        
        res.status(200).json({
            success: true,
            message: "Sell stock updated successfully",
            data: sellStock
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update sell stock",
            error: error.message 
        });
    }
};

exports.deleteSellStock = async (req, res) => {
    try {
        const { id } = req.params;
        const sellStock = await SellStock.findByPk(id);
        
        if (!sellStock) {
            return res.status(404).json({
                success: false,
                message: "Sell stock not found"
            });
        }
        
        await sellStock.destroy();
        
        res.status(200).json({
            success: true,
            message: "Sell stock deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete sell stock",
            error: error.message 
        });
    }
};
