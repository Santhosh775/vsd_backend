const ThirdParty = require('../model/thirdPartyModel');
const Product = require('../model/productModel');
const { Op } = require('sequelize');

// Function to generate registration number with sequential numbering
const generateRegistrationNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get the count of third parties created today to determine the next sequence number
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const todayThirdParties = await ThirdParty.count({
        where: {
            createdAt: {
                [Op.between]: [todayStart, todayEnd]
            }
        }
    });
    
    // Next sequence number (todayThirdParties count is 0-based, so we add 1)
    const sequence = (todayThirdParties + 1).toString().padStart(4, '0');
    return `TP${year}${month}${day}${sequence}`;
};

// Function to enrich third party data with detailed product information
const enrichThirdPartyWithProducts = async (thirdParty) => {
    const thirdPartyData = thirdParty.toJSON ? thirdParty.toJSON() : thirdParty;
    
    // If product_list exists and is an array, fetch detailed product information
    if (thirdPartyData.product_list && Array.isArray(thirdPartyData.product_list) && thirdPartyData.product_list.length > 0) {
        const products = await Product.findAll({
            where: {
                pid: {
                    [Op.in]: thirdPartyData.product_list
                }
            }
        });
        
        // Add detailed product information to the third party data
        thirdPartyData.detailed_products = products;
    }
    
    return thirdPartyData;
};

// Create a new third party
exports.createThirdParty = async (req, res) => {
    try {
        // Generate registration number if not provided
        if (!req.body.registration_number) {
            req.body.registration_number = await generateRegistrationNumber();
        }
        
        // Check if registration number already exists
        const existingThirdPartyByRegNumber = await ThirdParty.findOne({
            where: { registration_number: req.body.registration_number }
        });
        
        if (existingThirdPartyByRegNumber) {
            return res.status(400).json({
                success: false,
                message: 'Registration number already exists'
            });
        }
        
        // Check if email already exists (if provided)
        if (req.body.email) {
            const existingThirdPartyByEmail = await ThirdParty.findOne({
                where: { email: req.body.email }
            });
            
            if (existingThirdPartyByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/thirdpartys/${req.file.filename}`;
        }
        
        // Validate product_list if provided
        if (req.body.product_list) {
            // Check that product_list is an array, if not try to parse it
            if (!Array.isArray(req.body.product_list)) {
                // If it's a string, try to parse it as JSON
                if (typeof req.body.product_list === 'string') {
                    try {
                        req.body.product_list = JSON.parse(req.body.product_list);
                    } catch (parseError) {
                        // If parsing fails, convert comma-separated string to array
                        if (req.body.product_list.includes(',')) {
                            req.body.product_list = req.body.product_list.split(',').map(id => id.trim());
                        } else {
                            // If it's a single value, make it an array
                            req.body.product_list = [req.body.product_list];
                        }
                    }
                } else {
                    // If it's not a string and not an array, convert to array
                    req.body.product_list = [req.body.product_list];
                }
            }
            
            // Check that all product IDs exist in the products table
            const productIds = req.body.product_list;
            const existingProducts = await Product.findAll({
                where: {
                    pid: {
                        [Op.in]: productIds
                    }
                }
            });
            
            // Check if all provided product IDs were found
            const foundProductIds = existingProducts.map(product => product.pid);
            const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
            
            if (missingProductIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `The following product IDs do not exist: ${missingProductIds.join(', ')}`
                });
            }
        }
        
        const thirdParty = await ThirdParty.create(req.body);
        const enrichedThirdParty = await enrichThirdPartyWithProducts(thirdParty);
        
        res.status(201).json({
            success: true,
            message: 'Third party created successfully',
            data: enrichedThirdParty
        });
    } catch (error) {
        // Handle Sequelize unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.errors && error.errors[0]) {
                const field = error.errors[0].path;
                return res.status(400).json({
                    success: false,
                    message: `${field} already exists`
                });
            }
        }
        
        res.status(400).json({
            success: false,
            message: 'Error creating third party',
            error: error.message
        });
    }
};

// Get all third parties
exports.getAllThirdParties = async (req, res) => {
    try {
        const thirdParties = await ThirdParty.findAll();
        const enrichedThirdParties = await Promise.all(thirdParties.map(enrichThirdPartyWithProducts));
        
        res.status(200).json({
            success: true,
            message: 'Third parties retrieved successfully',
            data: enrichedThirdParties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving third parties',
            error: error.message
        });
    }
};

// Get third party by ID
exports.getThirdPartyById = async (req, res) => {
    try {
        const thirdParty = await ThirdParty.findByPk(req.params.id);
        if (!thirdParty) {
            return res.status(404).json({
                success: false,
                message: 'Third party not found'
            });
        }
        
        const enrichedThirdParty = await enrichThirdPartyWithProducts(thirdParty);
        
        res.status(200).json({
            success: true,
            message: 'Third party retrieved successfully',
            data: enrichedThirdParty
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving third party',
            error: error.message
        });
    }
};

// Update third party by ID
exports.updateThirdParty = async (req, res) => {
    try {
        const thirdParty = await ThirdParty.findByPk(req.params.id);
        if (!thirdParty) {
            return res.status(404).json({
                success: false,
                message: 'Third party not found'
            });
        }
        
        // Prevent updating registration number
        if (req.body.registration_number && req.body.registration_number !== thirdParty.registration_number) {
            return res.status(400).json({
                success: false,
                message: 'Registration number cannot be changed'
            });
        }
        
        // Check if email already exists (if provided and different from current)
        if (req.body.email && req.body.email !== thirdParty.email) {
            const existingThirdPartyByEmail = await ThirdParty.findOne({
                where: { email: req.body.email }
            });
            
            if (existingThirdPartyByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/thirdpartys/${req.file.filename}`;
        }
        
        // Validate product_list if provided
        if (req.body.product_list) {
            // Check that product_list is an array, if not try to parse it
            if (!Array.isArray(req.body.product_list)) {
                // If it's a string, try to parse it as JSON
                if (typeof req.body.product_list === 'string') {
                    try {
                        req.body.product_list = JSON.parse(req.body.product_list);
                    } catch (parseError) {
                        // If parsing fails, convert comma-separated string to array
                        if (req.body.product_list.includes(',')) {
                            req.body.product_list = req.body.product_list.split(',').map(id => id.trim());
                        } else {
                            // If it's a single value, make it an array
                            req.body.product_list = [req.body.product_list];
                        }
                    }
                } else {
                    // If it's not a string and not an array, convert to array
                    req.body.product_list = [req.body.product_list];
                }
            }
            
            // Check that all product IDs exist in the products table
            const productIds = req.body.product_list;
            const existingProducts = await Product.findAll({
                where: {
                    pid: {
                        [Op.in]: productIds
                    }
                }
            });
            
            // Check if all provided product IDs were found
            const foundProductIds = existingProducts.map(product => product.pid);
            const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
            
            if (missingProductIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `The following product IDs do not exist: ${missingProductIds.join(', ')}`
                });
            }
        }
        
        await thirdParty.update(req.body);
        const enrichedThirdParty = await enrichThirdPartyWithProducts(thirdParty);
        
        res.status(200).json({
            success: true,
            message: 'Third party updated successfully',
            data: enrichedThirdParty
        });
    } catch (error) {
        // Handle Sequelize unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.errors && error.errors[0]) {
                const field = error.errors[0].path;
                return res.status(400).json({
                    success: false,
                    message: `${field} already exists`
                });
            }
        }
        
        res.status(400).json({
            success: false,
            message: 'Error updating third party',
            error: error.message
        });
    }
};

// Delete third party by ID
exports.deleteThirdParty = async (req, res) => {
    try {
        const thirdParty = await ThirdParty.findByPk(req.params.id);
        if (!thirdParty) {
            return res.status(404).json({
                success: false,
                message: 'Third party not found'
            });
        }
        
        await thirdParty.destroy();
        res.status(200).json({
            success: true,
            message: 'Third party deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting third party',
            error: error.message
        });
    }
};

// Search third parties
exports.searchThirdParties = async (req, res) => {
    try {
        const { query } = req.query;
        const thirdParties = await ThirdParty.findAll({
            where: {
                [Op.or]: [
                    { third_party_name: { [Op.like]: `%${query}%` } },
                    { phone: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { city: { [Op.like]: `%${query}%` } },
                    { state: { [Op.like]: `%${query}%` } }
                ]
            }
        });
        
        const enrichedThirdParties = await Promise.all(thirdParties.map(enrichThirdPartyWithProducts));
        
        res.status(200).json({
            success: true,
            message: 'Third parties searched successfully',
            data: enrichedThirdParties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching third parties',
            error: error.message
        });
    }
};