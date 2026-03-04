const ProductCount = require('../model/productCountModel');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');

/**
 * Get all product counts - merges products with stored status from product_counts table.
 * Products not in product_counts default to 'inactive' status.
 */
exports.getAllProductCounts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const search = (req.query.search || '').trim().toLowerCase();
        const offset = (page - 1) * limit;

        const allProducts = await Product.findAll({
            include: [{
                model: Category,
                as: 'category',
                attributes: ['cid', 'categoryname']
            }],
            order: [['pid', 'ASC']]
        });

        const productCountMap = await ProductCount.findAll();
        const statusByProductId = {};
        productCountMap.forEach(pc => {
            statusByProductId[pc.product_id] = pc.status;
        });

        let merged = allProducts.map(product => ({
            pid: product.pid,
            product_name: product.product_name,
            category_id: product.category_id,
            categoryName: product.category?.categoryname || 'N/A',
            product_status: statusByProductId[product.pid] ?? 'inactive'
        }));

        if (search) {
            merged = merged.filter(
                p =>
                    (p.product_name || '').toLowerCase().includes(search) ||
                    (p.categoryName || '').toLowerCase().includes(search)
            );
        }

        const totalCount = merged.length;
        const paginated = merged.slice(offset, offset + limit);

        res.status(200).json({
            success: true,
            message: 'Product counts retrieved successfully',
            data: paginated,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product counts',
            error: error.message
        });
    }
};

/**
 * Update product count status (upsert).
 * Creates record if not exists, updates status if exists.
 */
exports.updateProductCountStatus = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { status } = req.body;

        if (!productId || isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }

        const validStatus = ['active', 'inactive'];
        const newStatus = validStatus.includes(status) ? status : 'inactive';

        const product = await Product.findByPk(productId, {
            include: [{ model: Category, as: 'category', attributes: ['cid', 'categoryname'] }]
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const categoryName = product.category?.categoryname || 'N/A';

        const [productCount, created] = await ProductCount.findOrCreate({
            where: { product_id: productId },
            defaults: {
                product_id: productId,
                product_name: product.product_name,
                category_id: product.category_id,
                category_name: categoryName,
                status: newStatus
            }
        });

        if (!created) {
            await productCount.update({
                product_name: product.product_name,
                category_id: product.category_id,
                category_name: categoryName,
                status: newStatus
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product count status updated successfully',
            data: {
                product_id: productCount.product_id,
                product_name: productCount.product_name,
                category_id: productCount.category_id,
                category_name: productCount.category_name,
                status: productCount.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update product count status',
            error: error.message
        });
    }
};

/**
 * Bulk update product count statuses
 */
exports.bulkUpdateProductCountStatus = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Updates array is required'
            });
        }

        const results = [];
        for (const item of updates) {
            const { product_id, status } = item;
            const productId = parseInt(product_id);
            const newStatus = ['active', 'inactive'].includes(status) ? status : 'inactive';

            const product = await Product.findByPk(productId, {
                include: [{ model: Category, as: 'category', attributes: ['cid', 'categoryname'] }]
            });

            if (!product) {
                results.push({ product_id: productId, success: false, message: 'Product not found' });
                continue;
            }

            const categoryName = product.category?.categoryname || 'N/A';

            const [productCount] = await ProductCount.findOrCreate({
                where: { product_id: productId },
                defaults: {
                    product_id: productId,
                    product_name: product.product_name,
                    category_id: product.category_id,
                    category_name: categoryName,
                    status: newStatus
                }
            });

            if (productCount) {
                await productCount.update({
                    product_name: product.product_name,
                    category_id: product.category_id,
                    category_name: categoryName,
                    status: newStatus
                });
                results.push({ product_id: productId, success: true });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Product count statuses updated',
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to bulk update product count statuses',
            error: error.message
        });
    }
};
