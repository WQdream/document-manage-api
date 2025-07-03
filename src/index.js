const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api', routes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 数据库同步函数
app.dbSync = async () => {
  try {
    // 同步数据库模型
    // await sequelize.sync({ alter: true });
        // 使用 force: true 会删除已存在的表
    // return sequelize.sync({ force: true });
    
    // 不带参数，只在表不存在时创建表
    await sequelize.sync();

    // 使用 alter: true 只会更新表结构，不会删除数据
    // return sequelize.sync({ alter: true });
    console.log('数据库连接成功并同步完成');
    return true;
  } catch (error) {
    console.error('数据库同步失败:', error);
    return false;
  }
};

// 导出 Express 应用实例
module.exports = app;