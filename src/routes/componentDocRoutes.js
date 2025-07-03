const express = require('express');
const router = express.Router();
const componentDocController = require('../controllers/componentDocController');
const { logOperation } = require('../middlewares/loggerMiddleware');

// 获取所有组件文档
router.get('/', componentDocController.getAllComponentDocs);

// 获取单个组件文档
router.get('/:id', componentDocController.getComponentDocById);

// 根据组件ID获取文档
router.get('/by-component/:componentId', componentDocController.getDocByComponentId);

// 创建新组件文档
router.post('/', logOperation('CREATE_DOC'), componentDocController.createComponentDoc);

// 更新组件文档
router.put('/:id', logOperation('UPDATE_DOC'), componentDocController.updateComponentDoc);

// 删除组件文档
router.delete('/:id', logOperation('DELETE_DOC'), componentDocController.deleteComponentDoc);

// 导入Markdown文档
router.post('/import-markdown', logOperation('IMPORT_DOC'), componentDocController.importMarkdown);

// 导出Markdown文档
router.get('/export-markdown/:id', logOperation('EXPORT_DOC'), componentDocController.exportMarkdown);

module.exports = router;