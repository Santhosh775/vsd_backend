const Category = require('../model/categoryModel');
const Product = require('../model/productModel');

exports.createCategory = async (req, res) => {
    try {
        const { categoryname, categorydescription } = req.body;
        
        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            where: { categoryname } 
        });
        
        if (existingCategory) {
            return res.status(400).json({ 
                success: false, 
                message: "Category with this name already exists" 
            });
        }
        
        // Handle file upload
        let category_image = null;
        if (req.file) {
            category_image = `/uploads/categories/${req.file.filename}`;
        }
        
        const newCategory = await Category.create({
            categoryname,
            categorydescription,
            category_image
        });
        
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: newCategory
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create category",
            error: error.message 
        });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const { page, limit, offset } = req.pagination;
        
        const { count, rows } = await Category.findAndCountAll({
            where: { category_status: 'active' },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch categories",
            error: error.message 
        });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch category",
            error: error.message 
        });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryname, categorydescription, category_status } = req.body;
        
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        if (categoryname && categoryname !== category.categoryname) {
            const existingCategory = await Category.findOne({ 
                where: { categoryname } 
            });
            if (existingCategory) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Category with this name already exists" 
                });
            }
        }
        
        let updateData = { categoryname, categorydescription, category_status };
        if (req.file) {
            updateData.category_image = `/uploads/categories/${req.file.filename}`;
        }
        
        await category.update(updateData);
        
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update category",
            error: error.message 
        });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        await category.destroy();
        
        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete category",
            error: error.message 
        });
    }
};

// Product Controllers
exports.createProduct = async (req, res) => {
    try {
        const { product_name, category_id, unit, current_price } = req.body;
        
        // Check if category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return res.status(400).json({ 
                success: false, 
                message: "Category not found" 
            });
        }
        
        let product_image = null;
        if (req.file) {
            product_image = `/uploads/products/${req.file.filename}`;
        }
        
        const newProduct = await Product.create({
            product_name,
            product_image,
            category_id,
            unit,
            current_price,
            default_status,
            product_status
        });
        
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: newProduct
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create product",
            error: error.message 
        });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const { page, limit, offset } = req.pagination;
        
        const { count, rows } = await Product.findAndCountAll({
            include: [{ model: Category, as: 'category', attributes: ['cid', 'categoryname'] }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch products",
            error: error.message 
        });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [{ model: Category, as: 'category', attributes: ['cid', 'categoryname'] }]
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch product",
            error: error.message 
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, category_id, unit, current_price, product_status, default_status } = req.body;
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        if (category_id) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Category not found" 
                });
            }
        }
        
        let updateData = { product_name, category_id, unit, product_status, default_status };
        
        // Handle price update with history
        if (current_price !== undefined && current_price !== null) {
            const today = new Date().toISOString().split('T')[0];
            let priceHistory = product.price_date;
            
            // Ensure priceHistory is an array
            if (!priceHistory || typeof priceHistory === 'string') {
                try {
                    priceHistory = priceHistory ? JSON.parse(priceHistory) : [];
                } catch (e) {
                    priceHistory = [];
                }
            } else if (!Array.isArray(priceHistory)) {
                priceHistory = [];
            }
            
            // Check if price already updated today
            const todayIndex = priceHistory.findIndex(entry => entry && entry.date === today);
            
            if (todayIndex >= 0) {
                // Update today's price
                priceHistory[todayIndex].price = parseFloat(current_price);
            } else {
                // Add new price entry
                priceHistory.push({
                    date: today,
                    price: parseFloat(current_price)
                });
            }
            
            updateData.current_price = current_price;
            updateData.price_date = priceHistory;
        }
        
        if (req.file) {
            updateData.product_image = `/uploads/products/${req.file.filename}`;
        }
        
        await product.update(updateData);
        
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update product",
            error: error.message 
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        await product.destroy();
        
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete product",
            error: error.message 
        });
    }
};