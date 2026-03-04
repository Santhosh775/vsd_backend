const Vendor = require('../model/vendorModel');
const Farmer = require('../model/farmerModel');
const Supplier = require('../model/supplierModel');
const ThirdParty = require('../model/thirdPartyModel');
const { vendorValidationRules, validate } = require('../validator/vendorValidator');

// Create vendor - saves to both vendor table and specific type table
const createVendor = async (req, res) => {
    const transaction = await Vendor.sequelize.transaction();
    
    try {
        const vendorData = req.body;
        const { vendor_type } = vendorData;
        
        // Handle profile image if uploaded
        if (req.file) {
            vendorData.profile_image = `/uploads/vendors/${req.file.filename}`;
        }
        
        // Save to vendor table (common table)
        const vendor = await Vendor.create(vendorData, { transaction });
        
        // Save to specific type table based on vendor_type
        let specificVendor;
        switch (vendor_type) {
            case 'farmer':
                // Use farmer_name if provided, otherwise map vendor_name to farmer_name
                const farmerData = { ...vendorData };
                if (!farmerData.farmer_name && farmerData.vendor_name) {
                    farmerData.farmer_name = farmerData.vendor_name;
                }
                delete farmerData.vendor_name;
                delete farmerData.vendor_type;
                specificVendor = await Farmer.create(farmerData, { transaction });
                break;
                
            case 'supplier':
                // Use supplier_name if provided, otherwise map vendor_name to supplier_name
                const supplierData = { ...vendorData };
                if (!supplierData.supplier_name && supplierData.vendor_name) {
                    supplierData.supplier_name = supplierData.vendor_name;
                }
                delete supplierData.vendor_name;
                delete supplierData.vendor_type;
                specificVendor = await Supplier.create(supplierData, { transaction });
                break;
                
            case 'thirdparty':
                // Use third_party_name if provided, otherwise map vendor_name to third_party_name
                const thirdPartyData = { ...vendorData };
                if (!thirdPartyData.third_party_name && thirdPartyData.vendor_name) {
                    thirdPartyData.third_party_name = thirdPartyData.vendor_name;
                }
                delete thirdPartyData.vendor_name;
                delete thirdPartyData.vendor_type;
                specificVendor = await ThirdParty.create(thirdPartyData, { transaction });
                break;
                
            default:
                throw new Error('Invalid vendor type');
        }
        
        await transaction.commit();
        
        return res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            data: {
                vendor,
                specificVendor
            }
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating vendor',
            error: error.message
        });
    }
};

// Get vendor by ID - retrieves from both vendor table and specific type table
const getVendor = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get vendor from common table
        const vendor = await Vendor.findByPk(id);
        
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        // Get from specific type table based on vendor_type
        let specificVendor;
        switch (vendor.vendor_type) {
            case 'farmer':
                specificVendor = await Farmer.findOne({ where: { registration_number: vendor.registration_number } });
                break;
                
            case 'supplier':
                specificVendor = await Supplier.findOne({ where: { registration_number: vendor.registration_number } });
                break;
                
            case 'thirdparty':
                specificVendor = await ThirdParty.findOne({ where: { registration_number: vendor.registration_number } });
                break;
        }
        
        return res.status(200).json({
            success: true,
            data: {
                vendor,
                specificVendor
            }
        });
        
    } catch (error) {
        console.error('Error fetching vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching vendor',
            error: error.message
        });
    }
};

// Get all vendors
const getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        return res.status(200).json({
            success: true,
            data: vendors
        });
        
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching vendors',
            error: error.message
        });
    }
};

// Update vendor - updates both vendor table and specific type table
const updateVendor = async (req, res) => {
    const transaction = await Vendor.sequelize.transaction();
    
    try {
        const { id } = req.params;
        const updateData = req.body;
        const { vendor_type } = updateData;
        
        // Handle profile image if uploaded
            if (req.file) {
                updateData.profile_image = `/uploads/vendors/${req.file.filename}`;
        }
        
        // Find the existing vendor
        const existingVendor = await Vendor.findByPk(id, { transaction });
        
        if (!existingVendor) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        // Update vendor table (common table)
        const vendor = await Vendor.update(updateData, {
            where: { vid: id },
            transaction,
            returning: true
        });
        
        // Update specific type table based on vendor_type
        let specificVendor;
        switch (existingVendor.vendor_type) { // Use existing vendor type
            case 'farmer':
                // Use farmer_name if provided, otherwise map vendor_name to farmer_name
                const farmerData = { ...updateData };
                if (!farmerData.farmer_name && farmerData.vendor_name) {
                    farmerData.farmer_name = farmerData.vendor_name;
                }
                delete farmerData.vendor_name;
                delete farmerData.vendor_type;
                specificVendor = await Farmer.update(farmerData, {
                    where: { registration_number: existingVendor.registration_number },
                    transaction,
                    returning: true
                });
                break;
                
            case 'supplier':
                // Use supplier_name if provided, otherwise map vendor_name to supplier_name
                const supplierData = { ...updateData };
                if (!supplierData.supplier_name && supplierData.vendor_name) {
                    supplierData.supplier_name = supplierData.vendor_name;
                }
                delete supplierData.vendor_name;
                delete supplierData.vendor_type;
                specificVendor = await Supplier.update(supplierData, {
                    where: { registration_number: existingVendor.registration_number },
                    transaction,
                    returning: true
                });
                break;
                
            case 'thirdparty':
                // Use third_party_name if provided, otherwise map vendor_name to third_party_name
                const thirdPartyData = { ...updateData };
                if (!thirdPartyData.third_party_name && thirdPartyData.vendor_name) {
                    thirdPartyData.third_party_name = thirdPartyData.vendor_name;
                }
                delete thirdPartyData.vendor_name;
                delete thirdPartyData.vendor_type;
                specificVendor = await ThirdParty.update(thirdPartyData, {
                    where: { registration_number: existingVendor.registration_number },
                    transaction,
                    returning: true
                });
                break;
        }
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true,
            message: 'Vendor updated successfully',
            data: {
                vendor,
                specificVendor
            }
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating vendor',
            error: error.message
        });
    }
};

// Delete vendor - deletes from both vendor table and specific type table
const deleteVendor = async (req, res) => {
    const transaction = await Vendor.sequelize.transaction();
    
    try {
        const { id } = req.params;
        
        // Find the existing vendor
        const existingVendor = await Vendor.findByPk(id, { transaction });
        
        if (!existingVendor) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        // Delete from specific type table based on vendor_type
        switch (existingVendor.vendor_type) {
            case 'farmer':
                await Farmer.destroy({
                    where: { registration_number: existingVendor.registration_number },
                    transaction
                });
                break;
                
            case 'supplier':
                await Supplier.destroy({
                    where: { registration_number: existingVendor.registration_number },
                    transaction
                });
                break;
                
            case 'thirdparty':
                await ThirdParty.destroy({
                    where: { registration_number: existingVendor.registration_number },
                    transaction
                });
                break;
        }
        
        // Delete from vendor table (common table)
        await Vendor.destroy({
            where: { vid: id },
            transaction
        });
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true,
            message: 'Vendor deleted successfully'
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting vendor',
            error: error.message
        });
    }
};

module.exports = {
    createVendor,
    getVendor,
    getAllVendors,
    updateVendor,
    deleteVendor
};