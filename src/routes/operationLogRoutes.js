const express = require('express');
const router = express.Router();
const operationLogController = require('../controllers/operationLogController');

// 获取所有操作日志
router.get('/', operationLogController.getAllLogs);

// 获取单个操作日志详情
router.get('/:id', operationLogController.getLogById);

// 删除操作日志
router.delete('/:id', operationLogController.deleteLog);

// 批量删除操作日志
router.post('/batch-delete', operationLogController.batchDeleteLogs);

// 清空特定日期之前的日志
router.post('/clear-before', operationLogController.clearLogsBefore);

module.exports = router; 