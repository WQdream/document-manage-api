const express = require('express');
const migrationController = require('../controllers/migrationController');

const router = express.Router();

// 迁移会话管理
router.post('/sessions', migrationController.createSession);
router.get('/sessions', migrationController.getSessions);
router.get('/sessions/:sessionId/comparison', migrationController.getComparisonData);
router.get('/sessions/:sessionId/modules', migrationController.getModuleOptions);
router.post('/sessions/:sessionId/toggle-selection', migrationController.toggleSelection);
router.post('/sessions/:sessionId/execute', migrationController.executeMigration);
router.delete('/sessions/:sessionId', migrationController.deleteSession);

// 导出功能
router.get('/export/:tableId', migrationController.exportTable);

module.exports = router;