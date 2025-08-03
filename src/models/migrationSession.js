const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MigrationSession = sequelize.define('MigrationSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '迁移会话名称'
    },
    sourceTableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'route_tables',
        key: 'id'
      },
      comment: '源表ID'
    },
    targetTableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'route_tables',
        key: 'id'
      },
      comment: '目标表ID'
    },
    status: {
      type: DataTypes.ENUM('draft', 'completed', 'exported'),
      defaultValue: 'draft',
      comment: '状态：draft-草稿, completed-完成, exported-已导出'
    },
    selectedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '选中的记录数'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '描述'
    }
  }, {
    tableName: 'migration_sessions',
    timestamps: true,
    paranoid: true,
    comment: '迁移会话'
  });

  return MigrationSession;
};