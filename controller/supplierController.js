const Supplier = require('../model/supplierModel');
const Product = require('../model/productModel');
const { Op } = require('sequelize');

// Function to generate registration number with sequential numbering
const generateRegistrationNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get the count of suppliers created today to determine the next sequence number
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const todaySuppliers = await Supplier.count({
        where: {
            createdAt: {
                [Op.between]: [todayStart, todayEnd]
            }
        }
    });
    
    // Next sequence number (todaySuppliers count is 0-based, so we add 1)
    const sequence = (todaySuppliers + 1).toString().padStart(4, '0');
    return `SUP${year}${month}${day}${sequence}`;
};

// Function to enrich supplier data with detailed product information
const enrichSupplierWithProducts = async (supplier) => {
    const supplierData = supplier.toJSON ? supplier.toJSON() : supplier;
    
    // If product_list exists and is an array, fetch detailed product information
    if (supplierData.product_list && Array.isArray(supplierData.product_list) && supplierData.product_list.length > 0) {
        const products = await Product.findAll({
            where: {
                pid: {
                    [Op.in]: supplierData.product_list
                }
            }
        });
        
        // Add detailed product information to the supplier data
        supplierData.detailed_products = products;
    }
    
    return supplierData;
};

// Create a new supplier
exports.createSupplier = async (req, res) => {
    try {
        // Generate registration number if not provided
        if (!req.body.registration_number) {
            req.body.registration_number = await generateRegistrationNumber();
        }
        
        // Check if registration number already exists
        const existingSupplierByRegNumber = await Supplier.findOne({
            where: { registration_number: req.body.registration_number }
        });
        
        if (existingSupplierByRegNumber) {
            return res.status(400).json({
                success: false,
                message: 'Registration number already exists'
            });
        }
        
        // Check if email already exists (if provided)
        if (req.body.email) {
            const existingSupplierByEmail = await Supplier.findOne({
                where: { email: req.body.email }
            });
            
            if (existingSupplierByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/suppliers/${req.file.filename}`;
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
        
        const supplier = await Supplier.create(req.body);
        const enrichedSupplier = await enrichSupplierWithProducts(supplier);
        
        res.status(201).json({
            success: true,
            message: 'Supplier created successfully',
            data: enrichedSupplier
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
            message: 'Error creating supplier',
            error: error.message
        });
    }
};

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll();
        const enrichedSuppliers = await Promise.all(suppliers.map(enrichSupplierWithProducts));
        
        res.status(200).json({
            success: true,
            message: 'Suppliers retrieved successfully',
            data: enrichedSuppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving suppliers',
            error: error.message
        });
    }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }
        
        const enrichedSupplier = await enrichSupplierWithProducts(supplier);
        
        res.status(200).json({
            success: true,
            message: 'Supplier retrieved successfully',
            data: enrichedSupplier
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving supplier',
            error: error.message
        });
    }
};

// Update supplier by ID
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }
        
        // Prevent updating registration number
        if (req.body.registration_number && req.body.registration_number !== supplier.registration_number) {
            return res.status(400).json({
                success: false,
                message: 'Registration number cannot be changed'
            });
        }
        
        // Check if email already exists (if provided and different from current)
        if (req.body.email && req.body.email !== supplier.email) {
            const existingSupplierByEmail = await Supplier.findOne({
                where: { email: req.body.email }
            });
            
            if (existingSupplierByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        // Handle profile image upload
        if (req.file) {
            req.body.profile_image = `/uploads/suppliers/${req.file.filename}`;
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
        
        await supplier.update(req.body);
        const enrichedSupplier = await enrichSupplierWithProducts(supplier);
        
        res.status(200).json({
            success: true,
            message: 'Supplier updated successfully',
            data: enrichedSupplier
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
            message: 'Error updating supplier',
            error: error.message
        });
    }
};

// Delete supplier by ID
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByPk(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }
        
        await supplier.destroy();
        res.status(200).json({
            success: true,
            message: 'Supplier deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting supplier',
            error: error.message
        });
    }
};

// Search suppliers
exports.searchSuppliers = async (req, res) => {
    try {
        const { query } = req.query;
        const suppliers = await Supplier.findAll({
            where: {
                [Op.or]: [
                    { supplier_name: { [Op.like]: `%${query}%` } },
                    { phone: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { city: { [Op.like]: `%${query}%` } },
                    { state: { [Op.like]: `%${query}%` } }
                ]
            }
        });
        
        const enrichedSuppliers = await Promise.all(suppliers.map(enrichSupplierWithProducts));
        
        res.status(200).json({
            success: true,
            message: 'Suppliers searched successfully',
            data: enrichedSuppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching suppliers',
            error: error.message
        });
    }
};