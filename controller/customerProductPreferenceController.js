const CustomerProductPreference = require('../model/customerProductPreferenceModel');
const Customer = require('../model/customerModel');
const Product = require('../model/productModel');

exports.createPreference = async (req, res) => {
    try {
        const { customer_id, product_id, enabled, display_order } = req.body;
        
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
        
        // If display_order is provided, increment existing orders >= display_order
        if (display_order !== null && display_order !== undefined) {
            await CustomerProductPreference.increment('display_order', {
                by: 1,
                where: {
                    customer_id,
                    display_order: { [require('sequelize').Op.gte]: display_order }
                }
            });
        }
        
        const newPreference = await CustomerProductPreference.create({ 
            customer_id, 
            product_id, 
            enabled: enabled || false,
            display_order: display_order || null
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
        
        const preferences = await CustomerProductPreference.findAll({
            where: { customer_id: customerId },
            include: [
                { model: Product, as: 'product', attributes: ['pid', 'product_name', 'product_image', 'current_price'] }
            ],
            order: [['display_order', 'ASC']]
        });
        
        res.status(200).json({ success: true, data: preferences });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch preferences", error: error.message });
    }
};

exports.updatePreference = async (req, res) => {
    try {
        const { customer_id, product_id } = req.params;
        const { enabled, display_order } = req.body;
        
        const preference = await CustomerProductPreference.findOne({
            where: { customer_id, product_id }
        });

        if (!preference) {
            return res.status(404).json({ success: false, message: "Preference not found" });
        }
        
        const oldDisplayOrder = preference.display_order;
        
        // If display_order is changing, adjust other orders
        if (display_order !== undefined && display_order !== oldDisplayOrder) {
            const { Op } = require('sequelize');
            
            if (oldDisplayOrder !== null) {
                // Decrement orders that were after the old position
                await CustomerProductPreference.decrement('display_order', {
                    by: 1,
                    where: {
                        customer_id,
                        display_order: { [Op.gt]: oldDisplayOrder },
                        product_id: { [Op.ne]: product_id }
                    }
                });
            }
            
            if (display_order !== null) {
                // Increment orders at or after the new position
                await CustomerProductPreference.increment('display_order', {
                    by: 1,
                    where: {
                        customer_id,
                        display_order: { [Op.gte]: display_order },
                        product_id: { [Op.ne]: product_id }
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
        const { customer_id, product_id } = req.params;
        
        const preference = await CustomerProductPreference.findOne({
            where: { customer_id, product_id }
        });

        if (!preference) {
            return res.status(404).json({ success: false, message: "Preference not found" });
        }
        
        const deletedDisplayOrder = preference.display_order;
        
        await preference.destroy();
        
        // Decrement display_order for products after the deleted one
        if (deletedDisplayOrder !== null) {
            await CustomerProductPreference.decrement('display_order', {
                by: 1,
                where: {
                    customer_id,
                    display_order: { [require('sequelize').Op.gt]: deletedDisplayOrder }
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
            await CustomerProductPreference.bulkCreate(
                enabledPreferences.map(p => ({ 
                    customer_id, 
                    product_id: p.product_id, 
                    enabled: true,
                    display_order: p.display_order || null
                }))
            );
        }
        
        res.status(200).json({ success: true, message: "Preferences updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update preferences", error: error.message });
    }
};
