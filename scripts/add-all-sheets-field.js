const { sequelize } = require('../src/models');

async function addAllSheetsField() {
  try {
    console.log('开始添加 allSheets 字段...');
    
    // 检查字段是否已存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'route_tables' AND COLUMN_NAME = 'allSheets'
    `);
    
    if (results.length === 0) {
      // 字段不存在，添加它
      await sequelize.query(`
        ALTER TABLE route_tables 
        ADD COLUMN allSheets LONGTEXT COMMENT '所有工作表的JSON数据'
      `);
      console.log('成功添加 allSheets 字段到 route_tables 表');
    } else {
      console.log('allSheets 字段已存在，无需添加');
    }
    
    console.log('迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
addAllSheetsField(); 