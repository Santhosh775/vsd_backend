const Farmer = require('../model/farmerModel');
const Product = require('../model/productModel');
const { Op } = require('sequelize');

// Function to generate registration number with sequential numbering
const generateRegistrationNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get the count of farmers created today to determine the next sequence number
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const todayFarmers = await Farmer.count({
        where: {
            createdAt: {
                [Op.between]: [todayStart, todayEnd]
            }
        }
    });
    
    // Next sequence number (todayFarmers count is 0-based, so we add 1)
    const sequence = (todayFarmers + 1).toString().padStart(4, '0');
    return `FAR${year}${month}${day}${sequence}`;
};

// Function to enrich farmer data with detailed product information
const enrichFarmerWithProducts = async (farmer) => {
    const farmerData = farmer.toJSON ? farmer.toJSON() : farmer;
    
    // If product_list exists and is an array, fetch detailed product information
    if (farmerData.product_list && Array.isArray(farmerData.product_list) && farmerData.product_list.length > 0) {
        const products = await Product.findAll({
            where: {
                pid: {
                    [Op.in]: farmerData.product_list
                }
            }
        });
        
        // Add detailed product information to the farmer data
        farmerData.detailed_products = products;
    }
    
    return farmerData;
};

// Create a new farmer
exports.createFarmer = async (req, res) => {
    try {
        // Generate registration number if not provided
        if (!req.body.registration_number) {
            req.body.registration_number = await generateRegistrationNumber();
        }
        
        // Check if registration number already exists
        const existingFarmerByRegNumber = await Farmer.findOne({
            where: { registration_number: req.body.registration_number }
        });
        
        if (existingFarmerByRegNumber) {
            return res.status(400).json({
                success: false,
                message: 'Registration number already exists'
            });
        }
        
        // Check if email already exists (if provided)
        if (req.body.email) {
            const existingFarmerByEmail = await Farmer.findOne({
                where: { email: req.body.email }
            });
            
            if (existingFarmerByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/farmers/${req.file.filename}`;
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
        
        const farmer = await Farmer.create(req.body);
        const enrichedFarmer = await enrichFarmerWithProducts(farmer);
        
        res.status(201).json({
            success: true,
            message: 'Farmer created successfully',
            data: enrichedFarmer
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
            message: 'Error creating farmer',
            error: error.message
        });
    }
};

// Get all farmers
exports.getAllFarmers = async (req, res) => {
    try {
        const farmers = await Farmer.findAll();
        const enrichedFarmers = await Promise.all(farmers.map(enrichFarmerWithProducts));
        
        res.status(200).json({
            success: true,
            message: 'Farmers retrieved successfully',
            data: enrichedFarmers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving farmers',
            error: error.message
        });
    }
};

// Get farmer by ID
exports.getFarmerById = async (req, res) => {
    try {
        const farmer = await Farmer.findByPk(req.params.id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }
        
        const enrichedFarmer = await enrichFarmerWithProducts(farmer);
        
        res.status(200).json({
            success: true,
            message: 'Farmer retrieved successfully',
            data: enrichedFarmer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving farmer',
            error: error.message
        });
    }
};

// Update farmer by ID
exports.updateFarmer = async (req, res) => {
    try {
        const farmer = await Farmer.findByPk(req.params.id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }
        
        // Prevent updating registration number
        if (req.body.registration_number && req.body.registration_number !== farmer.registration_number) {
            return res.status(400).json({
                success: false,
                message: 'Registration number cannot be changed'
            });
        }
        
        // Check if email already exists (if provided and different from current)
        if (req.body.email && req.body.email !== farmer.email) {
            const existingFarmerByEmail = await Farmer.findOne({
                where: { email: req.body.email }
            });
            
            if (existingFarmerByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/farmers/${req.file.filename}`;
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
        
        await farmer.update(req.body);
        const enrichedFarmer = await enrichFarmerWithProducts(farmer);
        
        res.status(200).json({
            success: true,
            message: 'Farmer updated successfully',
            data: enrichedFarmer
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
            message: 'Error updating farmer',
            error: error.message
        });
    }
};

// Delete farmer by ID
exports.deleteFarmer = async (req, res) => {
    try {
        const farmer = await Farmer.findByPk(req.params.id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }
        
        await farmer.destroy();
        res.status(200).json({
            success: true,
            message: 'Farmer deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting farmer',
            error: error.message
        });
    }
};

// Search farmers
exports.searchFarmers = async (req, res) => {
    try {
        const { query } = req.query;
        const farmers = await Farmer.findAll({
            where: {
                [Op.or]: [
                    { farmer_name: { [Op.like]: `%${query}%` } },
                    { phone: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { city: { [Op.like]: `%${query}%` } },
                    { state: { [Op.like]: `%${query}%` } }
                ]
            }
        });
        
        const enrichedFarmers = await Promise.all(farmers.map(enrichFarmerWithProducts));
        
        res.status(200).json({
            success: true,
            message: 'Farmers searched successfully',
            data: enrichedFarmers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching farmers',
            error: error.message
        });
    }
};