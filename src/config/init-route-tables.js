const { sequelize, RouteTable, RouteRecord, MigrationSession } = require('../models');

// 只初始化路由表相关的数据库表
async function initRouteTables() {
  try {
    console.log('正在同步路由表相关模型...');
    
    // 只同步新的路由表模型，不影响现有表
    await RouteTable.sync();
    await RouteRecord.sync();
    await MigrationSession.sync();
    
    console.log('路由表模型同步完成！');
    console.log('路由表功能已就绪，现有数据未受影响。');

    return { success: true, message: '路由表初始化成功' };
  } catch (error) {
    console.error('路由表初始化失败:', error);
    return { success: false, message: '路由表初始化失败', error: error.message };
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initRouteTables()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('初始化过程中发生错误:', err);
      process.exit(1);
    });
}

module.exports = { initRouteTables };