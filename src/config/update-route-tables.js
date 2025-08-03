const { sequelize } = require('../models');

// 更新路由表结构，修复数据类型问题
async function updateRouteTables() {
  try {
    console.log('正在更新路由表结构...');
    
    // 删除现有的路由表（如果有数据会丢失，但现在应该是空的）
    await sequelize.query('DROP TABLE IF EXISTS `migration_sessions`');
    await sequelize.query('DROP TABLE IF EXISTS `route_records`');
    await sequelize.query('DROP TABLE IF EXISTS `route_tables`');
    
    console.log('已删除旧的路由表结构');
    
    // 重新创建表结构
    const { RouteTable, RouteRecord, MigrationSession } = require('../models');
    await RouteTable.sync();
    await RouteRecord.sync();
    await MigrationSession.sync();
    
    console.log('路由表结构更新完成！');
    console.log('现在可以正常上传Excel文件了。');

    return { success: true, message: '路由表结构更新成功' };
  } catch (error) {
    console.error('更新路由表结构失败:', error);
    return { success: false, message: '更新路由表结构失败', error: error.message };
  }
}

// 如果直接运行此文件，则执行更新
if (require.main === module) {
  updateRouteTables()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('更新过程中发生错误:', err);
      process.exit(1);
    });
}

module.exports = { updateRouteTables };