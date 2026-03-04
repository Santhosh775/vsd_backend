const express = require('express');
const router = express.Router();

const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } = require('../controller/productController');
const { createProductValidation, updateProductValidation, validate } = require('../validator/productValidator');
const { uploadProduct } = require('../middleware/upload');
const { paginate } = require('../middleware/pagination');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, uploadProduct.single('product_image'), createProductValidation, validate, createProduct);
router.get('/list', paginate, getAllProducts);
router.get('/:id', authMiddleware, getProductById);
router.put('/:id', authMiddleware, uploadProduct.single('product_image'), updateProductValidation, validate, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;