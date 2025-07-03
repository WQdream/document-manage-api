const express = require('express');
const router = express.Router();

// 导入路由模块
const categoryRoutes = require('./categoryRoutes');
const componentRoutes = require('./componentRoutes');
const componentDocRoutes = require('./componentDocRoutes');
const operationLogRoutes = require('./operationLogRoutes');

// 设置路由
router.use('/categories', categoryRoutes);
router.use('/components', componentRoutes);
router.use('/docs', componentDocRoutes);
router.use('/logs', operationLogRoutes);

// API根路由
router.get('/', (req, res) => {
  res.json({
    message: '组件文档系统API',
    version: '1.0.0',
    endpoints: [
      '/api/categories',
      '/api/components',
      '/api/docs',
      '/api/logs'
    ]
  });
});

module.exports = router;