const MultipleProductBox = require('../model/multipleProductBoxModel');

const normalizeToArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0);
    }
    return [];
};

const normalizeNetWeights = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'object' && !Array.isArray(value)) {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            const key = String(k);
            if (v !== undefined && v !== null && v !== '') out[key] = String(v);
        }
        return Object.keys(out).length ? out : null;
    }
    return null;
};

exports.createMultipleProductBox = async (req, res) => {
    try {
        const { name, short, product_ids, packing_types, net_weights, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        const box = await MultipleProductBox.create({
            name,
            short: short || null,
            product_ids: normalizeToArray(product_ids),
            packing_types: normalizeToArray(packing_types),
            net_weights: normalizeNetWeights(net_weights),
            status: status === 'inactive' ? 'inactive' : 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Multiple product box created successfully',
            data: box
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create multiple product box',
            error: error.message
        });
    }
};

exports.getAllMultipleProductBoxes = async (req, res) => {
    try {
        const boxes = await MultipleProductBox.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Multiple product boxes retrieved successfully',
            data: boxes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch multiple product boxes',
            error: error.message
        });
    }
};

exports.getMultipleProductBoxById = async (req, res) => {
    try {
        const { id } = req.params;
        const box = await MultipleProductBox.findByPk(id);

        if (!box) {
            return res.status(404).json({
                success: false,
                message: 'Multiple product box not found'
            });
        }

        res.status(200).json({
            success: true,
            data: box
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch multiple product box',
            error: error.message
        });
    }
};

exports.updateMultipleProductBox = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, short, product_ids, packing_types, net_weights, status } = req.body;

        const box = await MultipleProductBox.findByPk(id);

        if (!box) {
            return res.status(404).json({
                success: false,
                message: 'Multiple product box not found'
            });
        }

        const updateData = {};

        if (typeof name === 'string') updateData.name = name;
        if (typeof short === 'string') updateData.short = short;
        if (product_ids !== undefined) {
            updateData.product_ids = normalizeToArray(product_ids);
        }
        if (packing_types !== undefined) {
            updateData.packing_types = normalizeToArray(packing_types);
        }
        if (net_weights !== undefined) {
            updateData.net_weights = normalizeNetWeights(net_weights);
        }
        if (status === 'active' || status === 'inactive') {
            updateData.status = status;
        }

        await box.update(updateData);

        res.status(200).json({
            success: true,
            message: 'Multiple product box updated successfully',
            data: box
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update multiple product box',
            error: error.message
        });
    }
};

exports.deleteMultipleProductBox = async (req, res) => {
    try {
        const { id } = req.params;
        const box = await MultipleProductBox.findByPk(id);

        if (!box) {
            return res.status(404).json({
                success: false,
                message: 'Multiple product box not found'
            });
        }

        await box.destroy();

        res.status(200).json({
            success: true,
            message: 'Multiple product box deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete multiple product box',
            error: error.message
        });
    }
};

