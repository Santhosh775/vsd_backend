const InventoryStock = require('../model/inventoryStockModel');
const Inventory = require('../model/inventoryModel');
const InventoryCompany = require('../model/inventoryCompanyModel');
const { sequelize } = require('../config/db');

exports.createInventoryStock = async (req, res) => {
    try {
        const { invoice_no, company_name, company_id, item_name, hsn_code, quantity, price_per_unit, gst_percentage, inventory_id } = req.body;
        
        const total_with_gst = (quantity * price_per_unit * (1 + gst_percentage / 100)).toFixed(2);
        
        const newStock = await InventoryStock.create({
            invoice_no,
            company_name,
            company_id,
            item_name,
            hsn_code,
            quantity,
            price_per_unit,
            gst_percentage,
            total_with_gst,
            inventory_id
        });
        
        // Update inventory quantity
        if (inventory_id) {
            await updateInventoryQuantity(inventory_id);
        }
        
        res.status(201).json({
            success: true,
            message: "Inventory stock created successfully",
            data: newStock
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create inventory stock",
            error: error.message 
        });
    }
};

exports.getAllInventoryStocks = async (req, res) => {
    try {
        const stocks = await InventoryStock.findAll({
            include: [
                {
                    model: Inventory,
                    as: 'inventory'
                },
                {
                    model: InventoryCompany,
                    as: 'company'
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            data: stocks
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch inventory stocks",
            error: error.message 
        });
    }
};

exports.getInventoryStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const stock = await InventoryStock.findByPk(id, {
            include: [
                {
                    model: Inventory,
                    as: 'inventory'
                },
                {
                    model: InventoryCompany,
                    as: 'company'
                }
            ]
        });
        
        if (!stock) {
            return res.status(404).json({
                success: false,
                message: "Inventory stock not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: stock
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch inventory stock",
            error: error.message 
        });
    }
};

exports.updateInventoryStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { invoice_no, company_name, company_id, item_name, hsn_code, quantity, price_per_unit, gst_percentage, inventory_id } = req.body;
        
        const stock = await InventoryStock.findByPk(id);
        if (!stock) {
            return res.status(404).json({
                success: false,
                message: "Inventory stock not found"
            });
        }
        
        const oldInventoryId = stock.inventory_id;
        const total_with_gst = (quantity * price_per_unit * (1 + gst_percentage / 100)).toFixed(2);
        
        await stock.update({
            invoice_no,
            company_name,
            company_id,
            item_name,
            hsn_code,
            quantity,
            price_per_unit,
            gst_percentage,
            total_with_gst,
            inventory_id
        });
        
        // Update inventory quantities
        if (oldInventoryId) {
            await updateInventoryQuantity(oldInventoryId);
        }
        if (inventory_id && inventory_id !== oldInventoryId) {
            await updateInventoryQuantity(inventory_id);
        }
        
        res.status(200).json({
            success: true,
            message: "Inventory stock updated successfully",
            data: stock
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update inventory stock",
            error: error.message 
        });
    }
};

exports.deleteInventoryStock = async (req, res) => {
    try {
        const { id } = req.params;
        const stock = await InventoryStock.findByPk(id);
        
        if (!stock) {
            return res.status(404).json({
                success: false,
                message: "Inventory stock not found"
            });
        }
        
        const inventoryId = stock.inventory_id;
        await stock.destroy();
        
        // Update inventory quantity
        if (inventoryId) {
            await updateInventoryQuantity(inventoryId);
        }
        
        res.status(200).json({
            success: true,
            message: "Inventory stock deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete inventory stock",
            error: error.message 
        });
    }
};

// Helper function to update inventory quantity
const updateInventoryQuantity = async (inventoryId) => {
    const result = await InventoryStock.findOne({
        where: { inventory_id: inventoryId },
        attributes: [
            [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
        ],
        raw: true
    });
    
    const totalQuantity = parseFloat(result?.total_quantity || 0);
    
    await Inventory.update(
        { quantity: totalQuantity },
        { where: { id: inventoryId } }
    );
};

exports.getCompanyTotals = async (req, res) => {
    try {
        const { company_id } = req.params;
        
        const result = await InventoryStock.findOne({
            where: { company_id },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total_with_gst')), 'total_amount']
            ],
            raw: true
        });
        
        const totalAmount = parseFloat(result?.total_amount || 0);
        
        res.status(200).json({
            success: true,
            data: {
                company_id,
                total_amount: totalAmount.toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch company totals",
            error: error.message 
        });
    }
};

exports.getInventoryQuantities = async (req, res) => {
    try {
        const result = await InventoryStock.findAll({
            attributes: [
                'item_name',
                'company_name',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
            ],
            group: ['item_name', 'company_name'],
            raw: true
        });
        
        // Group by item_name
        const grouped = result.reduce((acc, item) => {
            if (!acc[item.item_name]) {
                acc[item.item_name] = {
                    item: item.item_name,
                    totalQuantity: 0,
                    companies: []
                };
            }
            const qty = parseFloat(item.total_quantity || 0);
            acc[item.item_name].totalQuantity += qty;
            acc[item.item_name].companies.push({
                company: item.company_name,
                quantity: qty.toFixed(2)
            });
            return acc;
        }, {});
        
        res.status(200).json({
            success: true,
            data: Object.values(grouped)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch inventory quantities",
            error: error.message 
        });
    }
};
