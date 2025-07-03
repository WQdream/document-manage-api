const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentController');
const { logOperation } = require('../middlewares/loggerMiddleware');

// 获取所有组件
router.get('/', componentController.getAllComponents);

// 获取单个组件
router.get('/:id', componentController.getComponentById);

// 根据componentId获取组件
router.get('/by-component-id/:componentId', componentController.getComponentByComponentId);

// 创建新组件
router.post('/', logOperation('CREATE_COMPONENT'), componentController.createComponent);

// 更新组件
router.put('/:id', logOperation('UPDATE_COMPONENT'), componentController.updateComponent);

// 删除组件
router.delete('/:id', logOperation('DELETE_COMPONENT'), componentController.deleteComponent);

module.exports = router;