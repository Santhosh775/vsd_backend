const { sequelize } = require('../config/db');
const Draft = require('../model/draftModel');

// Generate customer name with date format
const generateCustomerNameWithDate = (customerName, orderReceivedDate) => {
    if (!orderReceivedDate) return customerName;
    const date = new Date(orderReceivedDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${customerName}_${day}-${month}-${year}`;
};

// Helper function to transform draft for API response
const transformDraft = (draft) => {
    const transformedDraft = draft.toJSON(); // Convert to plain object
    return transformedDraft;
};

// Create a new draft
const createDraft = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            customerName,
            customerId,
            orderReceivedDate,
            phoneNumber,
            email,
            alternateContact,
            deliveryAddress,
            neededByDate,
            preferredTime,
            priority,
            products
        } = req.body;

        // Generate customer name with date if orderReceivedDate is provided
        const customerNameWithDate = orderReceivedDate 
            ? generateCustomerNameWithDate(customerName, orderReceivedDate)
            : customerName;

        // Create the draft object with only provided fields
        const draftData = {
            customer_name: customerNameWithDate,
            phone_number: phoneNumber,
            email: email,
            alternate_contact: alternateContact,
            delivery_address: deliveryAddress,
            needed_by_date: neededByDate,
            preferred_time: preferredTime,
            priority: priority,
            draft_data: {
                products: products
            }
        };

        // Only add customerId if it's provided and not null/undefined in the request body
        if (customerId !== undefined && customerId !== null && customerId !== '') {
            draftData.customer_id = customerId;
        }

        // Calculate total amount from products
        let totalAmount = 0;
        if (products && products.length > 0) {
            totalAmount = products.reduce((sum, product) => {
                const netWeight = parseFloat(product.netWeight) || 0;
                const marketPrice = parseFloat(product.marketPrice) || 0;
                return sum + (netWeight * marketPrice);
            }, 0);
        }
        draftData.total_amount = totalAmount.toFixed(2);

        // Create the draft
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

// Update draft
const updateDraft = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            customerName,
            customerId,
            orderReceivedDate,
            phoneNumber,
            email,
            alternateContact,
            deliveryAddress,
            neededByDate,
            preferredTime,
            priority,
            products
        } = req.body;

        // Find and update the draft
        const draft = await Draft.findByPk(id, { transaction: t });
        if (!draft) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        // Generate customer name with date if orderReceivedDate is provided
        const customerNameWithDate = orderReceivedDate 
            ? generateCustomerNameWithDate(customerName, orderReceivedDate)
            : customerName;

        // Create the update object with only provided fields
        const updateData = {
            customer_name: customerNameWithDate,
            phone_number: phoneNumber,
            email: email,
            alternate_contact: alternateContact,
            delivery_address: deliveryAddress,
            needed_by_date: neededByDate,
            preferred_time: preferredTime,
            priority: priority,
            draft_data: {
                products: products
            }
        };

        // Only add customerId if it's provided and not null/undefined in the request body
        if (customerId !== undefined && customerId !== null && customerId !== '') {
            updateData.customer_id = customerId;
        }

        // Calculate total amount from products
        let totalAmount = 0;
        if (products && products.length > 0) {
            totalAmount = products.reduce((sum, product) => {
                const netWeight = parseFloat(product.netWeight) || 0;
                const marketPrice = parseFloat(product.marketPrice) || 0;
                return sum + (netWeight * marketPrice);
            }, 0);
        }
        updateData.total_amount = totalAmount.toFixed(2);

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