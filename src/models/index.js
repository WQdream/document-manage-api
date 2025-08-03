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

// 路由表管理相关模型
const RouteTable = require('./routeTable')(sequelize);
const RouteRecord = require('./routeRecord')(sequelize);
const MigrationSession = require('./migrationSession')(sequelize);

// 设置模型关联
Category.hasMany(Component, { foreignKey: 'categoryId', as: 'components' });
Component.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Component.hasOne(ComponentDoc, { foreignKey: 'componentId', as: 'doc' });
ComponentDoc.belongsTo(Component, { foreignKey: 'componentId', as: 'component' });

// 路由表管理关联
RouteTable.hasMany(RouteRecord, { foreignKey: 'tableId', as: 'records' });
RouteRecord.belongsTo(RouteTable, { foreignKey: 'tableId', as: 'table' });

MigrationSession.belongsTo(RouteTable, { foreignKey: 'sourceTableId', as: 'sourceTable' });
MigrationSession.belongsTo(RouteTable, { foreignKey: 'targetTableId', as: 'targetTable' });

// 导出模型和Sequelize实例
module.exports = {
  sequelize,
  Sequelize,
  Category,
  Component,
  ComponentDoc,
  OperationLog,
  RouteTable,
  RouteRecord,
  MigrationSession
};