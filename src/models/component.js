const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Component = sequelize.define('Component', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    componentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '组件唯一标识符'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '组件名称'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属分类ID'
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序顺序'
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
    tableName: 'components',
    timestamps: true
  });

  return Component;
};