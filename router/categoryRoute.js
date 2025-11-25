const express = require('express');
const router = express.Router();

const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controller/productController');
const { createCategoryValidation, updateCategoryValidation, validate } = require('../validator/categoryValidator');
const { uploadCategory } = require('../middleware/upload');
const { paginate } = require('../middleware/pagination');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, uploadCategory.single('category_image'), createCategoryValidation, validate, createCategory);
router.get('/list', authMiddleware, paginate, getAllCategories);
router.get('/:id', authMiddleware, getCategoryById);
router.put('/:id', authMiddleware, uploadCategory.single('category_image'), updateCategoryValidation, validate, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;