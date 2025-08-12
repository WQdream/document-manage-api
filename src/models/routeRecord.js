const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RouteRecord = sequelize.define('RouteRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'route_tables',
        key: 'id'
      },
      comment: '所属路由表ID'
    },
    // 路由字段 - 按照你提供的表头
    routeId: {
      type: DataTypes.STRING(50),
      comment: 'id'
    },
    parentId: {
      type: DataTypes.STRING(50),
      comment: 'parent_id'
    },
    name: {
      type: DataTypes.STRING(200),
      comment: 'name'
    },
    path: {
      type: DataTypes.STRING(500),
      comment: 'path'
    },
    title: {
      type: DataTypes.STRING(200),
      comment: 'title'
    },
    icon: {
      type: DataTypes.STRING(200),
      comment: 'icon'
    },
    notCache: {
      type: DataTypes.BOOLEAN,
      comment: 'not_cache'
    },
    hideInMenu: {
      type: DataTypes.BOOLEAN,
      comment: 'hide_in_menu'
    },
    component: {
      type: DataTypes.STRING(500),
      comment: 'component'
    },
    redirect: {
      type: DataTypes.STRING(500),
      comment: 'redirect'
    },
    order: {
      type: DataTypes.STRING(100),
      comment: 'order'
    },
    src: {
      type: DataTypes.STRING(500),
      comment: 'src'
    },
    keyRule: {
      type: DataTypes.TEXT,
      comment: 'key_rule'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      comment: 'is_active'
    },
    moduleId: {
      type: DataTypes.STRING(50),
      comment: 'module_id'
    },
    nav: {
      type: DataTypes.STRING(200),
      comment: 'nav'
    },
    type: {
      type: DataTypes.STRING(100),
      comment: 'type'
    },
    moduleName: {
      type: DataTypes.STRING(200),
      comment: '模块名称'
    },
    model: {
      type: DataTypes.STRING(200),
      comment: 'model'
    },
    word: {
      type: DataTypes.TEXT,
      comment: 'word'
    },
    // 迁移相关字段
    isSelected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否被选中迁移'
    },
    sourceRecordId: {
      type: DataTypes.INTEGER,
      comment: '源记录ID（用于标准表记录关联源表记录）'
    },
    rowIndex: {
      type: DataTypes.INTEGER,
      comment: 'Excel中的行号'
    },
    rawData: {
      type: DataTypes.TEXT,
      comment: '原始Excel数据的JSON字符串'
    }
  }, {
    tableName: 'route_records',
    timestamps: true,
    paranoid: true,
    comment: '路由记录'
  });

  return RouteRecord;
};