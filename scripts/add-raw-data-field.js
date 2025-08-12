const { sequelize } = require('../src/models');

async function addRawDataField() {
  try {
    console.log('开始添加rawData字段...');
    
    // 检查字段是否已存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'route_records' AND COLUMN_NAME = 'rawData'
    `);
    
    if (results.length === 0) {
      // 字段不存在，添加它
      await sequelize.query(`
        ALTER TABLE route_records 
        ADD COLUMN rawData TEXT COMMENT '原始Excel数据的JSON字符串'
      `);
      console.log('成功添加rawData字段到route_records表');
    } else {
      console.log('rawData字段已存在，无需添加');
    }
    
    console.log('迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
addRawDataField(); 