const { Category, Component, ComponentDoc, OperationLog } = require('../models');

// 清理默认数据，保留空的表结构
async function cleanDefaultData() {
  try {
    console.log('正在清理默认数据...');
    
    // 删除默认的组件文档
    await ComponentDoc.destroy({ where: {}, force: true });
    console.log('已清理组件文档数据');
    
    // 删除默认的组件
    await Component.destroy({ where: {}, force: true });
    console.log('已清理组件数据');
    
    // 删除默认的分类
    await Category.destroy({ where: {}, force: true });
    console.log('已清理分类数据');
    
    // 删除操作日志
    await OperationLog.destroy({ where: {}, force: true });
    console.log('已清理操作日志');
    
    console.log('默认数据清理完成！现在你有一个干净的环境。');

    return { success: true, message: '默认数据清理成功' };
  } catch (error) {
    console.error('清理默认数据失败:', error);
    return { success: false, message: '清理默认数据失败', error: error.message };
  }
}

// 如果直接运行此文件，则执行清理
if (require.main === module) {
  cleanDefaultData()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('清理过程中发生错误:', err);
      process.exit(1);
    });
}

module.exports = { cleanDefaultData };