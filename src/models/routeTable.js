const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RouteTable = sequelize.define('RouteTable', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 路由表基本信息
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '路由表名称'
    },
    type: {
      type: DataTypes.ENUM('source', 'standard'),
      allowNull: false,
      comment: '表类型：source-源表(杂乱表), standard-标准表'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '描述'
    },
    // 文件信息
    originalFileName: {
      type: DataTypes.STRING(255),
      comment: '原始文件名'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      comment: '文件大小(字节)'
    },
    totalRows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总行数'
    },
    allSheets: {
      type: DataTypes.TEXT('long'),
      comment: '所有工作表的JSON数据'
    },
    status: {
      type: DataTypes.ENUM('active', 'archived'),
      defaultValue: 'active',
      comment: '状态'
    }
  }, {
    tableName: 'route_tables',
    timestamps: true,
    paranoid: true, // 软删除
    comment: '路由表管理'
  });

  return RouteTable;
};