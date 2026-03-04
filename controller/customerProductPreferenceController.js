const CustomerProductPreference = require('../model/customerProductPreferenceModel');
const Customer = require('../model/customerModel');
const Product = require('../model/productModel');
const MultipleProductBox = require('../model/multipleProductBoxModel');
const { Op } = require('sequelize');

const parseJsonField = (field) => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

exports.createPreference = async (req, res) => {
    try {
        const { customer_id, product_id, multiple_product_box_id, enabled, display_order } = req.body;

        const customer = await Customer.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        let itemType = 'product';
        let productId = product_id || null;
        let multipleProductBoxId = multiple_product_box_id || null;

        if (multiple_product_box_id) {
            const box = await MultipleProductBox.findByPk(multiple_product_box_id);
            if (!box) {
                return res.status(404).json({ success: false, message: "Multiple product box not found" });
            }
            itemType = 'multiple_product_box';
            multipleProductBoxId = multiple_product_box_id;
        } else if (product_id) {
            const product = await Product.findByPk(product_id);
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }
            productId = product_id;
        } else {
            return res.status(400).json({ success: false, message: "Either product_id or multiple_product_box_id is required" });
        }

        const whereClause = itemType === 'product'
            ? { customer_id, product_id: productId }
            : { customer_id, multiple_product_box_id: multipleProductBoxId };

        const existingPreference = await CustomerProductPreference.findOne({ where: whereClause });
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
            product_id: productId,
            multiple_product_box_id: multipleProductBoxId,
            item_type: itemType,
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
                { model: Product, as: 'product', attributes: ['pid', 'product_name', 'product_image', 'current_price', 'category_id'], required: false },
                { model: MultipleProductBox, as: 'multipleProductBox', attributes: ['id', 'name', 'short', 'product_ids', 'packing_types', 'status'], required: false }
            ],
            order: [
                ['display_order', 'ASC'],
                ['id', 'ASC']
            ]
        });

        const formatted = preferences.map(p => {
            const base = {
                id: p.id,
                customer_id: p.customer_id,
                item_type: p.item_type || (p.multiple_product_box_id ? 'multiple_product_box' : 'product'),
                enabled: p.enabled,
                display_order: p.display_order
            };
            if (p.item_type === 'multiple_product_box' && p.multipleProductBox) {
                return {
                    ...base,
                    product_id: null,
                    multiple_product_box_id: p.multiple_product_box_id,
                    product_name: p.multipleProductBox.name,
                    product_image: null,
                    current_price: null,
                    multipleProductBox: p.multipleProductBox
                };
            }
            if (p.product) {
                return {
                    ...base,
                    product_id: p.product_id,
                    multiple_product_box_id: null,
                    product_name: p.product.product_name,
                    product_image: p.product.product_image,
                    current_price: p.product.current_price,
                    product: p.product
                };
            }
            return { ...base, product_id: p.product_id, multiple_product_box_id: p.multiple_product_box_id, product_name: 'N/A' };
        });

        if (!full) {
            return res.status(200).json({ success: true, data: formatted });
        }

        const [allProducts, allBoxes] = await Promise.all([
            Product.findAll({ attributes: ['pid', 'product_name', 'product_image', 'current_price', 'category_id'], where: { product_status: 'active' } }),
            MultipleProductBox.findAll({ where: { status: 'active' }, attributes: ['id', 'name', 'short', 'product_ids', 'packing_types', 'status'] })
        ]);

        const prefMap = {};
        formatted.forEach(p => {
            const key = p.item_type === 'multiple_product_box'
                ? `box_${p.multiple_product_box_id}`
                : `product_${p.product_id}`;
            prefMap[key] = p;
        });

        const productItems = allProducts.map(product => {
            const p = prefMap[`product_${product.pid}`];
            return {
                product_id: product.pid,
                multiple_product_box_id: null,
                item_type: 'product',
                product_name: product.product_name,
                product_image: product.product_image,
                current_price: product.current_price,
                enabled: p ? p.enabled : false,
                display_order: p ? p.display_order : '',
                product
            };
        });

        const boxItems = allBoxes.map(box => {
            const p = prefMap[`box_${box.id}`];
            return {
                product_id: null,
                multiple_product_box_id: box.id,
                item_type: 'multiple_product_box',
                product_name: box.name,
                product_image: null,
                current_price: null,
                enabled: p ? p.enabled : false,
                display_order: p ? p.display_order : '',
                multipleProductBox: box
            };
        });

        const merged = [...productItems, ...boxItems].sort((a, b) => {
            const orderA = a.display_order !== '' && a.display_order != null ? Number(a.display_order) : 999999;
            const orderB = b.display_order !== '' && b.display_order != null ? Number(b.display_order) : 999999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.item_type === 'product' ? 0 : 1) - (b.item_type === 'product' ? 0 : 1);
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

exports.updatePreferenceForBox = async (req, res) => {
    try {
        const customer_id = req.params.customer_id;
        const boxId = req.params.boxId;
        const { enabled, display_order } = req.body;

        const preference = await CustomerProductPreference.findOne({
            where: { customer_id, multiple_product_box_id: boxId }
        });

        if (!preference) {
            return res.status(404).json({ success: false, message: "Multiple product box preference not found" });
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

exports.deletePreferenceForBox = async (req, res) => {
    try {
        const customer_id = req.params.customer_id;
        const boxId = req.params.boxId;

        const preference = await CustomerProductPreference.findOne({
            where: { customer_id, multiple_product_box_id: boxId }
        });

        if (!preference) {
            return res.status(404).json({ success: false, message: "Multiple product box preference not found" });
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

        const enabledPreferences = preferences.filter(p => p.enabled);

        await CustomerProductPreference.destroy({ where: { customer_id } });

        if (enabledPreferences.length > 0) {
            const toCreate = enabledPreferences.map(p => {
                const isBox = p.multiple_product_box_id != null;
                return {
                    customer_id,
                    product_id: isBox ? null : p.product_id,
                    multiple_product_box_id: isBox ? p.multiple_product_box_id : null,
                    item_type: isBox ? 'multiple_product_box' : 'product',
                    enabled: true,
                    display_order: p.display_order ?? null
                };
            });
            await CustomerProductPreference.bulkCreate(toCreate);
        }

        res.status(200).json({ success: true, message: "Preferences updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update preferences", error: error.message });
    }
};
