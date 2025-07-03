const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ComponentDoc = sequelize.define('ComponentDoc', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    componentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '关联的组件ID'
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '组件标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '组件描述'
    },
    usage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '使用场景'
    },
    props: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '属性列表，JSON格式',
      get() {
        const rawValue = this.getDataValue('props');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('props', JSON.stringify(value));
      }
    },
    events: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '事件列表，JSON格式',
      get() {
        const rawValue = this.getDataValue('events');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('events', JSON.stringify(value));
      }
    },
    examples: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '示例列表，JSON格式',
      get() {
        const rawValue = this.getDataValue('examples');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('examples', JSON.stringify(value));
      }
    },
    markdownContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Markdown格式的完整文档'
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
    tableName: 'component_docs',
    timestamps: true
  });

  return ComponentDoc;
};