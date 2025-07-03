const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { logOperation } = require('../middlewares/loggerMiddleware');

// 获取所有分类
router.get('/', categoryController.getAllCategories);

// 获取菜单结构（包含所有分类及其组件）
router.get('/menu/structure', categoryController.getMenuStructure);

// 获取单个分类及其组件
router.get('/:id', categoryController.getCategoryById);

// 创建新分类
router.post('/', logOperation('CREATE_CATEGORY'), categoryController.createCategory);

// 更新分类
router.put('/:id', logOperation('UPDATE_CATEGORY'), categoryController.updateCategory);

// 删除分类
router.delete('/:id', logOperation('DELETE_CATEGORY'), categoryController.deleteCategory);

module.exports = router;