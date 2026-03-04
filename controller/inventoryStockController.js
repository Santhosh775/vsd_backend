const InventoryStock = require('../model/inventoryStockModel');
const Inventory = require('../model/inventoryModel');
const InventoryCompany = require('../model/inventoryCompanyModel');
const { sequelize } = require('../config/db');

exports.createInventoryStock = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        let { invoice_no, company_name, company_id, items, date } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Items array is required"
            });
        }

        const inventoryIds = new Set();
        const processedItems = items.map(item => {
            const { item_name, hsn_code, quantity, price_per_unit, gst_percentage, inventory_id } = item;
            const gst = gst_percentage != null ? parseFloat(gst_percentage) : 0;
            const total_with_gst = parseFloat((quantity * price_per_unit * (1 + gst / 100)).toFixed(2));

            if (inventory_id) inventoryIds.add(inventory_id);

            return {
                item_name,
                hsn_code,
                quantity: parseFloat(quantity),
                price_per_unit: parseFloat(price_per_unit),
                gst_percentage: gst,
                total_with_gst,
                inventory_id: inventory_id ? parseInt(inventory_id) : null
            };
        });

        const total_with_gst = processedItems.reduce((sum, item) => sum + item.total_with_gst, 0);

        const newStock = await InventoryStock.create({
            invoice_no,
            company_name,
            company_id,
            items: processedItems,
            total_with_gst,
            date
        }, { transaction });

        for (const inventoryId of inventoryIds) {
            await updateInventoryQuantity(inventoryId, transaction);
        }

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: "Inventory stock created successfully",
            data: newStock
        });
    } catch (error) {
        await transaction.rollback();
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
                    model: InventoryCompany,
                    as: 'company'
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Return data in original format with nested items
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
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        let { invoice_no, company_name, company_id, items, date } = req.body;

        const stock = await InventoryStock.findByPk(id);
        if (!stock) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Inventory stock not found"
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: "Items array is required"
            });
        }

        const oldInventoryIds = new Set();
        if (stock.items) {
            let oldItems = stock.items;
            if (typeof oldItems === 'string') {
                try {
                    oldItems = JSON.parse(oldItems);
                } catch (e) {
                    console.error("Error parsing stock.items in updateInventoryStock:", e);
                    oldItems = [];
                }
            }
            if (Array.isArray(oldItems)) {
                oldItems.forEach(item => {
                    if (item.inventory_id) oldInventoryIds.add(item.inventory_id);
                });
            }
        }

        const newInventoryIds = new Set();
        const processedItems = items.map(item => {
            const { item_name, hsn_code, quantity, price_per_unit, gst_percentage, inventory_id } = item;
            const gst = gst_percentage != null ? parseFloat(gst_percentage) : 0;
            const total_with_gst = parseFloat((quantity * price_per_unit * (1 + gst / 100)).toFixed(2));

            if (inventory_id) newInventoryIds.add(inventory_id);

            return {
                item_name,
                hsn_code,
                quantity: parseFloat(quantity),
                price_per_unit: parseFloat(price_per_unit),
                gst_percentage: gst,
                total_with_gst,
                inventory_id: inventory_id ? parseInt(inventory_id) : null
            };
        });

        const total_with_gst = processedItems.reduce((sum, item) => sum + item.total_with_gst, 0);

        await stock.update({
            invoice_no,
            company_name,
            company_id,
            items: processedItems,
            total_with_gst,
            date
        }, { transaction });

        const allInventoryIds = new Set([...oldInventoryIds, ...newInventoryIds]);
        for (const inventoryId of allInventoryIds) {
            await updateInventoryQuantity(inventoryId, transaction);
        }

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Inventory stock updated successfully",
            data: stock
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: "Failed to update inventory stock",
            error: error.message
        });
    }
};

exports.deleteInventoryStock = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const stock = await InventoryStock.findByPk(id);

        if (!stock) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Inventory stock not found"
            });
        }

        const inventoryIds = new Set();
        if (stock.items) {
            let items = stock.items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    console.error("Error parsing stock.items in deleteInventoryStock:", e);
                    items = [];
                }
            }
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (item.inventory_id) inventoryIds.add(item.inventory_id);
                });
            }
        }

        await stock.destroy({ transaction });

        for (const inventoryId of inventoryIds) {
            await updateInventoryQuantity(inventoryId, transaction);
        }

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Inventory stock deleted successfully"
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: "Failed to delete inventory stock",
            error: error.message
        });
    }
};

// Helper function to update inventory quantity
const updateInventoryQuantity = async (inventoryId, transaction = null) => {
    const stocks = await InventoryStock.findAll({
        attributes: ['items'],
        raw: true,
        transaction
    });

    let totalQuantity = 0;
    stocks.forEach(stock => {
        if (stock.items) {
            let items = stock.items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    console.error("Error parsing stock.items in updateInventoryQuantity:", e);
                    items = [];
                }
            }
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (item.inventory_id === inventoryId) {
                        totalQuantity += parseFloat(item.quantity || 0);
                    }
                });
            }
        }
    });

    await Inventory.update(
        { quantity: totalQuantity },
        { where: { id: inventoryId }, transaction }
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
        const stocks = await InventoryStock.findAll({
            attributes: ['items', 'company_name'],
            raw: true
        });

        const grouped = {};
        stocks.forEach(stock => {
            if (stock.items) {
                let items = stock.items;
                if (typeof items === 'string') {
                    try {
                        items = JSON.parse(items);
                    } catch (e) {
                        console.error("Error parsing stock.items in getInventoryQuantities:", e);
                        items = [];
                    }
                }

                if (Array.isArray(items)) {
                    items.forEach(item => {
                        if (!grouped[item.item_name]) {
                            grouped[item.item_name] = {
                                item: item.item_name,
                                totalQuantity: 0,
                                companies: []
                            };
                        }
                        const qty = parseFloat(item.quantity || 0);
                        grouped[item.item_name].totalQuantity += qty;
                        grouped[item.item_name].companies.push({
                            company: stock.company_name,
                            quantity: qty.toFixed(2)
                        });
                    });
                }
            }
        });

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