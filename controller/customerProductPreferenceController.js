const CustomerProductPreference = require('../model/customerProductPreferenceModel');
const Customer = require('../model/customerModel');
const Product = require('../model/productModel');
const { Op } = require('sequelize');

exports.createPreference = async (req, res) => {
    try {
        const { customer_id, product_id, enabled, display_order } = req.body;

        if (!customer_id || !product_id) {
            return res.status(400).json({ success: false, message: "customer_id and product_id are required" });
        }

        const customer = await Customer.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const existingPreference = await CustomerProductPreference.findOne({
            where: { customer_id, product_id }
        });
        if (existingPreference) {
            return res.status(400).json({ success: false, message: "Preference already exists" });
        }

        if (display_order !== null && display_order !== undefined) {
            await CustomerProductPreference.increment('display_order', {
                by: 1,
                where: {
                    customer_id,
                    display_order: { [Op.gte]: display_order }
                }
            });
        }

        const newPreference = await CustomerProductPreference.create({
            customer_id,
            product_id,
            enabled: enabled ?? false,
            display_order: display_order ?? null
        });

        res.status(201).json({
            success: true,
            message: "Preference created successfully",
            data: newPreference
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create preference", error: error.message });
    }
};

exports.getPreferencesByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const full = req.query.full === 'true' || req.query.full === true;

        const preferences = await CustomerProductPreference.findAll({
            where: { customer_id: customerId },
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['pid', 'product_name', 'product_image', 'current_price', 'category_id'],
                    required: false
                }
            ],
            order: [
                ['display_order', 'ASC'],
                ['id', 'ASC']
            ]
        });

        const formatted = preferences.map(p => ({
            id: p.id,
            customer_id: p.customer_id,
            product_id: p.product_id,
            enabled: p.enabled,
            display_order: p.display_order,
            product_name: p.product ? p.product.product_name : 'N/A',
            product_image: p.product ? p.product.product_image : null,
            current_price: p.product ? p.product.current_price : null,
            product: p.product || null
        }));

        if (!full) {
            return res.status(200).json({ success: true, data: formatted });
        }

        const allProducts = await Product.findAll({
            attributes: ['pid', 'product_name', 'product_image', 'current_price', 'category_id'],
            where: { product_status: 'active' }
        });

        const prefMap = {};
        formatted.forEach(p => {
            prefMap[p.product_id] = p;
        });

        const merged = allProducts.map(product => {
            const p = prefMap[product.pid];
            return {
                product_id: product.pid,
                product_name: product.product_name,
                product_image: product.product_image,
                current_price: product.current_price,
                enabled: p ? p.enabled : false,
                display_order: p ? p.display_order : '',
                product
            };
        }).sort((a, b) => {
            const orderA = a.display_order !== '' && a.display_order != null ? Number(a.display_order) : 999999;
            const orderB = b.display_order !== '' && b.display_order != null ? Number(b.display_order) : 999999;
            if (orderA !== orderB) return orderA - orderB;
            return a.product_name.localeCompare(b.product_name);
        });

        res.status(200).json({ success: true, data: merged });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch preferences", error: error.message });
    }
};

exports.updatePreference = async (req, res) => {
    try {
        const customer_id = req.params.customerId || req.params.customer_id;
        const product_id = req.params.productId || req.params.product_id;
        const { enabled, display_order } = req.body;

        const preference = await CustomerProductPreference.findOne({
            where: { customer_id, product_id }
        });

        if (!preference) {
            return res.status(404).json({ success: false, message: "Preference not found" });
        }

        const oldDisplayOrder = preference.display_order;

        if (display_order !== undefined && display_order !== oldDisplayOrder) {
            if (oldDisplayOrder != null) {
                await CustomerProductPreference.decrement('display_order', {
                    by: 1,
                    where: {
                        customer_id,
                        display_order: { [Op.gt]: oldDisplayOrder },
                        id: { [Op.ne]: preference.id }
                    }
                });
            }
            if (display_order != null) {
                await CustomerProductPreference.increment('display_order', {
                    by: 1,
                    where: {
                        customer_id,
                        display_order: { [Op.gte]: display_order },
                        id: { [Op.ne]: preference.id }
                    }
                });
            }
        }

        await preference.update({
            enabled: enabled !== undefined ? enabled : preference.enabled,
            display_order: display_order !== undefined ? display_order : preference.display_order
        });

        res.status(200).json({ success: true, message: "Preference updated successfully", data: preference });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update preference", error: error.message });
    }
};

exports.deletePreference = async (req, res) => {
    try {
        const customer_id = req.params.customerId || req.params.customer_id;
        const product_id = req.params.productId || req.params.product_id;

        const preference = await CustomerProductPreference.findOne({
            where: { customer_id, product_id }
        });

        if (!preference) {
            return res.status(404).json({ success: false, message: "Preference not found" });
        }

        const deletedDisplayOrder = preference.display_order;
        await preference.destroy();

        if (deletedDisplayOrder != null) {
            await CustomerProductPreference.decrement('display_order', {
                by: 1,
                where: {
                    customer_id,
                    display_order: { [Op.gt]: deletedDisplayOrder }
                }
            });
        }

        res.status(200).json({ success: true, message: "Preference deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete preference", error: error.message });
    }
};

exports.bulkUpdatePreferences = async (req, res) => {
    try {
        const { customer_id, preferences } = req.body;

        if (!customer_id || !preferences || !Array.isArray(preferences)) {
            return res.status(400).json({ success: false, message: "Invalid request data" });
        }

        const customer = await Customer.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const enabledPreferences = preferences.filter(p => p.enabled && p.product_id != null);

        await CustomerProductPreference.destroy({ where: { customer_id } });

        if (enabledPreferences.length > 0) {
            const toCreate = enabledPreferences.map(p => ({
                customer_id,
                product_id: p.product_id,
                enabled: true,
                display_order: p.display_order ?? null
            }));
            await CustomerProductPreference.bulkCreate(toCreate);
        }

        res.status(200).json({ success: true, message: "Preferences updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update preferences", error: error.message });
    }
};
