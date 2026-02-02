const { sequelize } = require('../config/db');
const Draft = require('../model/draftModel');

// Helper function to transform draft for API response
const transformDraft = (draft) => {
    const transformedDraft = draft.toJSON(); // Convert to plain object
    return transformedDraft;
};

// Create a new draft (NewOrder payload: customerName, customerId, orderReceivedDate, packingDate, packingDay, orderType, detailsComment, products)
const createDraft = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            customerName,
            customerId,
            orderReceivedDate,
            packingDate,
            packingDay,
            orderType,
            detailsComment,
            products
        } = req.body;

        const draftData = {
            customer_name: customerName || '',
            order_received_date: orderReceivedDate || null,
            packing_date: packingDate || null,
            packing_day: packingDay || null,
            order_type: orderType || null,
            details_comment: detailsComment || null,
            draft_data: {
                products: Array.isArray(products) ? products : []
            },
            total_amount: 0
        };

        if (customerId !== undefined && customerId !== null && customerId !== '') {
            draftData.customer_id = customerId;
        }

        const draft = await Draft.create(draftData, { transaction: t });

        await t.commit();

        // Transform the draft according to the specification
        const transformedDraft = transformDraft(draft);

        res.status(201).json({
            success: true,
            message: 'Draft saved successfully',
            data: transformedDraft
        });
    } catch (error) {
        await t.rollback();
        console.error('Error saving draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save draft',
            error: error.message
        });
    }
};

// Get all drafts
const getAllDrafts = async (req, res) => {
    try {
        const drafts = await Draft.findAll({
            order: [['createdAt', 'DESC']]
        });

        // Transform all drafts according to the specification
        const transformedDrafts = drafts.map(draft => transformDraft(draft));

        res.status(200).json({
            success: true,
            data: transformedDrafts
        });
    } catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch drafts',
            error: error.message
        });
    }
};

// Get draft by ID
const getDraftById = async (req, res) => {
    try {
        const { id } = req.params;
        const draft = await Draft.findByPk(id);

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        // Transform the draft according to the specification
        const transformedDraft = transformDraft(draft);

        res.status(200).json({
            success: true,
            data: transformedDraft
        });
    } catch (error) {
        console.error('Error fetching draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch draft',
            error: error.message
        });
    }
};

// Update draft (same payload as create: customerName, customerId, orderReceivedDate, packingDate, packingDay, orderType, detailsComment, products)
const updateDraft = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            customerName,
            customerId,
            orderReceivedDate,
            packingDate,
            packingDay,
            orderType,
            detailsComment,
            products
        } = req.body;

        const draft = await Draft.findByPk(id, { transaction: t });
        if (!draft) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        const updateData = {
            customer_name: customerName != null ? customerName : draft.customer_name,
            order_received_date: orderReceivedDate !== undefined ? (orderReceivedDate || null) : draft.order_received_date,
            packing_date: packingDate !== undefined ? (packingDate || null) : draft.packing_date,
            packing_day: packingDay !== undefined ? (packingDay || null) : draft.packing_day,
            order_type: orderType !== undefined ? (orderType || null) : draft.order_type,
            details_comment: detailsComment !== undefined ? (detailsComment || null) : draft.details_comment,
            draft_data: {
                products: Array.isArray(products) ? products : (draft.draft_data?.products || [])
            },
            total_amount: 0
        };

        if (customerId !== undefined && customerId !== null && customerId !== '') {
            updateData.customer_id = customerId;
        } else if (customerId === null || customerId === '') {
            updateData.customer_id = null;
        }

        await draft.update(updateData, { transaction: t });

        await t.commit();

        // Transform the draft according to the specification
        const transformedDraft = transformDraft(draft);

        res.status(200).json({
            success: true,
            message: 'Draft updated successfully',
            data: transformedDraft
        });
    } catch (error) {
        await t.rollback();
        console.error('Error updating draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update draft',
            error: error.message
        });
    }
};

// Delete draft
const deleteDraft = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        // Find the draft
        const draft = await Draft.findByPk(id, { transaction: t });
        if (!draft) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        // Delete the draft
        await draft.destroy({ transaction: t });

        await t.commit();

        res.status(200).json({
            success: true,
            message: 'Draft deleted successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete draft',
            error: error.message
        });
    }
};

module.exports = {
    createDraft,
    getAllDrafts,
    getDraftById,
    updateDraft,
    deleteDraft
};