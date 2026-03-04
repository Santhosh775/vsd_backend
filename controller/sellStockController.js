const SellStock = require('../model/sellStockModel');
const { Stock } = require('../model/associations');
const { sequelize } = require('../config/db');

exports.createSellStock = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { stockId, entityType, entityId, driverId, labourId, pricePerKg, quantity, totalAmount } = req.body;

        const qtyToSell = parseFloat(quantity) || 0;
        if (!qtyToSell || qtyToSell <= 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid quantity to sell'
            });
        }

        // Find a base stock row to infer product name (and validate stockId)
        const baseStock = await Stock.findByPk(stockId, { transaction });
        if (!baseStock) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Base stock not found for the given stockId'
            });
        }

        const productName = baseStock.products;

        // FIFO: deduct from oldest stock first, similar to updateStage2Assignment
        const stocks = await Stock.findAll({
            where: { products: productName },
            order: [[sequelize.literal('COALESCE(stock_creation_time, created_at)'), 'ASC']],
            transaction
        });

        let remainingToSell = qtyToSell;
        let primaryStockId = null;
        let totalAvailable = 0;

        for (const stock of stocks) {
            if (remainingToSell <= 0) break;
            const currentQty = parseFloat(stock.quantity) || 0;
            if (currentQty <= 0) continue;

            totalAvailable += currentQty;

            const deduction = Math.min(currentQty, remainingToSell);
            const newQty = currentQty - deduction;

            if (!primaryStockId) {
                primaryStockId = stock.stock_id;
            }

            if (newQty <= 0) {
                await stock.destroy({ transaction });
            } else {
                await stock.update({ quantity: newQty }, { transaction });
            }

            remainingToSell -= deduction;
        }

        if (remainingToSell > 0.0001) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Insufficient stock for product ${productName}. Requested ${qtyToSell.toFixed(2)} kg, available ${(totalAvailable).toFixed(2)} kg (using oldest stock first).`
            });
        }

        const sellStock = await SellStock.create({
            stock_id: primaryStockId || stockId,
            stock_item_name: productName || null,
            entity_type: entityType,
            entity_id: entityId,
            driver_id: driverId || null,
            labour_id: labourId || null,
            price_per_kg: pricePerKg,
            quantity: qtyToSell,
            total_amount: totalAmount
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: "Sell stock created successfully",
            data: sellStock
        });
    } catch (error) {
        await transaction.rollback();
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
        const { stockId, stockItemName, entityType, entityId, driverId, labourId, pricePerKg, quantity, totalAmount } = req.body;
        
        const sellStock = await SellStock.findByPk(id);
        if (!sellStock) {
            return res.status(404).json({
                success: false,
                message: "Sell stock not found"
            });
        }
        
        const updatePayload = {
            stock_id: stockId,
            entity_type: entityType,
            entity_id: entityId,
            driver_id: driverId || null,
            labour_id: labourId || null,
            price_per_kg: pricePerKg,
            quantity: quantity,
            total_amount: totalAmount
        };
        if (stockItemName !== undefined) updatePayload.stock_item_name = stockItemName || null;
        await sellStock.update(updatePayload);
        
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
