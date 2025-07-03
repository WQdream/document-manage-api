const { Sequelize } = require('sequelize');
const config = require('../config/database');

// 确定当前环境
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

// 导入模型
const Category = require('./category')(sequelize);
const Component = require('./component')(sequelize);
const ComponentDoc = require('./componentDoc')(sequelize);
const OperationLog = require('./operationLog')(sequelize);

// 设置模型关联
Category.hasMany(Component, { foreignKey: 'categoryId', as: 'components' });
Component.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Component.hasOne(ComponentDoc, { foreignKey: 'componentId', as: 'doc' });
ComponentDoc.belongsTo(Component, { foreignKey: 'componentId', as: 'component' });

// 导出模型和Sequelize实例
module.exports = {
  sequelize,
  Sequelize,
  Category,
  Component,
  ComponentDoc,
  OperationLog
};