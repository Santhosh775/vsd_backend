const Farmer = require('../model/farmerModel');
const Product = require('../model/productModel');
const { Op } = require('sequelize');

// Function to generate registration number with sequential numbering
const generateRegistrationNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const todayFarmers = await Farmer.count({
        where: {
            createdAt: {
                [Op.between]: [todayStart, todayEnd]
            }
        }
    });
    
    const sequence = (todayFarmers + 1).toString().padStart(4, '0');
    return `FAR${year}${month}${day}${sequence}`;
};

// Function to enrich farmer data with detailed product information
const enrichFarmerWithProducts = async (farmer) => {
    const farmerData = farmer.toJSON ? farmer.toJSON() : farmer;
    
    if (farmerData.product_list && Array.isArray(farmerData.product_list) && farmerData.product_list.length > 0) {
        const productIds = farmerData.product_list.map(item => 
            typeof item === 'object' ? item.pid : item
        );
        
        const products = await Product.findAll({
            where: {
                pid: {
                    [Op.in]: productIds
                }
            }
        });
        
        farmerData.detailed_products = products;
    }
    
    return farmerData;
};

// Create a new farmer
exports.createFarmer = async (req, res) => {
    try {
        if (!req.body.registration_number) {
            req.body.registration_number = await generateRegistrationNumber();
        }
        
        const existingFarmerByRegNumber = await Farmer.findOne({
            where: { registration_number: req.body.registration_number }
        });
        
        if (existingFarmerByRegNumber) {
            return res.status(400).json({
                success: false,
                message: 'Registration number already exists'
            });
        }
        
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
        
        if (req.file) {
            req.body.profile_image = `/uploads/farmers/${req.file.filename}`;
        }
        
        if (req.body.product_list) {
            if (!Array.isArray(req.body.product_list)) {
                if (typeof req.body.product_list === 'string') {
                    try {
                        req.body.product_list = JSON.parse(req.body.product_list);
                    } catch (parseError) {
                        if (req.body.product_list.includes(',')) {
                            req.body.product_list = req.body.product_list.split(',').map(id => parseInt(id.trim()));
                        } else {
                            req.body.product_list = [parseInt(req.body.product_list)];
                        }
                    }
                } else {
                    req.body.product_list = [req.body.product_list];
                }
            }
            
            const productIds = req.body.product_list.map(item => 
                typeof item === 'object' ? item.pid : parseInt(item)
            );
            
            const existingProducts = await Product.findAll({
                where: {
                    pid: {
                        [Op.in]: productIds
                    }
                }
            });
            
            const foundProductIds = existingProducts.map(product => product.pid);
            const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
            
            if (missingProductIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `The following product IDs do not exist: ${missingProductIds.join(', ')}`
                });
            }
            
            req.body.product_list = existingProducts.map(product => ({
                pid: product.pid,
                product_name: product.product_name
            }));
        }
        
        const farmer = await Farmer.create(req.body);
        const enrichedFarmer = await enrichFarmerWithProducts(farmer);
        
        res.status(201).json({
            success: true,
            message: 'Farmer created successfully',
            data: enrichedFarmer
        });
    } catch (error) {
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
        
        if (req.body.registration_number && req.body.registration_number !== farmer.registration_number) {
            return res.status(400).json({
                success: false,
                message: 'Registration number cannot be changed'
            });
        }
        
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
        
        if (req.file) {
            req.body.profile_image = `/uploads/farmers/${req.file.filename}`;
        }
        
        if (req.body.product_list) {
            if (!Array.isArray(req.body.product_list)) {
                if (typeof req.body.product_list === 'string') {
                    try {
                        req.body.product_list = JSON.parse(req.body.product_list);
                    } catch (parseError) {
                        if (req.body.product_list.includes(',')) {
                            req.body.product_list = req.body.product_list.split(',').map(id => parseInt(id.trim()));
                        } else {
                            req.body.product_list = [parseInt(req.body.product_list)];
                        }
                    }
                } else {
                    req.body.product_list = [req.body.product_list];
                }
            }
            
            const productIds = req.body.product_list.map(item => 
                typeof item === 'object' ? item.pid : parseInt(item)
            );
            
            const existingProducts = await Product.findAll({
                where: {
                    pid: {
                        [Op.in]: productIds
                    }
                }
            });
            
            const foundProductIds = existingProducts.map(product => product.pid);
            const missingProductIds = productIds.filter(id => !foundProductIds.includes(id));
            
            if (missingProductIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `The following product IDs do not exist: ${missingProductIds.join(', ')}`
                });
            }
            
            req.body.product_list = existingProducts.map(product => ({
                pid: product.pid,
                product_name: product.product_name
            }));
        }
        
        await farmer.update(req.body);
        const enrichedFarmer = await enrichFarmerWithProducts(farmer);
        
        res.status(200).json({
            success: true,
            message: 'Farmer updated successfully',
            data: enrichedFarmer
        });
    } catch (error) {
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

// Get farmer's products
exports.getFarmerProducts = async (req, res) => {
    try {
        const farmer = await Farmer.findByPk(req.params.id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }
        
        if (!farmer.product_list || !Array.isArray(farmer.product_list) || farmer.product_list.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No products found for this farmer',
                data: []
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Farmer products retrieved successfully',
            data: farmer.product_list
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving farmer products',
            error: error.message
        });
    }
};
