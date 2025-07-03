const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OperationLog = sequelize.define('OperationLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    operationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型：CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY, CREATE_COMPONENT, UPDATE_COMPONENT, DELETE_COMPONENT, CREATE_DOC, UPDATE_DOC, DELETE_DOC, IMPORT_DOC, EXPORT_DOC'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作目标ID，如分类ID、组件ID、文档ID等'
    },
    targetName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '操作目标名称，如分类名称、组件名称等'
    },
    operationContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作内容，可以是JSON字符串，记录详细操作内容'
    },
    operatorIp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作者IP地址'
    },
    operatorInfo: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '操作者信息，如用户代理、设备信息等'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'operation_logs',
    comment: '操作记录表'
  });

  return OperationLog;
}; 