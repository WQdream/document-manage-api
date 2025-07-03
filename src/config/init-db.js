const { sequelize, Category, Component, ComponentDoc } = require('../models');

// 初始化数据库
async function initDatabase() {
  try {
    // 同步数据库模型（强制重建表）
    console.log('正在同步数据库模型...');
    await sequelize.sync({ force: true });
    console.log('数据库模型同步完成！');

    // 创建初始分类数据
    console.log('正在创建初始分类数据...');
    const categories = await Category.bulkCreate([
      { name: '基础组件', order: 1 },
      { name: '表单组件', order: 2 },
      { name: '数据展示', order: 3 },
      { name: '导航组件', order: 4 },
      { name: '反馈组件', order: 5 }
    ]);
    console.log(`创建了 ${categories.length} 个分类`);

    // 创建初始组件数据
    console.log('正在创建初始组件数据...');
    const components = await Component.bulkCreate([
      // 基础组件
      { componentId: 'button', name: '按钮', categoryId: 1, order: 1 },
      { componentId: 'icon', name: '图标', categoryId: 1, order: 2 },
      { componentId: 'layout', name: '布局', categoryId: 1, order: 3 },
      
      // 表单组件
      { componentId: 'input', name: '输入框', categoryId: 2, order: 1 },
      { componentId: 'select', name: '选择器', categoryId: 2, order: 2 },
      { componentId: 'checkbox', name: '复选框', categoryId: 2, order: 3 },
      { componentId: 'radio', name: '单选框', categoryId: 2, order: 4 },
      
      // 数据展示
      { componentId: 'table', name: '表格', categoryId: 3, order: 1 },
      { componentId: 'tag', name: '标签', categoryId: 3, order: 2 },
      
      // 导航组件
      { componentId: 'menu', name: '菜单', categoryId: 4, order: 1 },
      { componentId: 'tabs', name: '标签页', categoryId: 4, order: 2 },
      
      // 反馈组件
      { componentId: 'modal', name: '对话框', categoryId: 5, order: 1 },
      { componentId: 'message', name: '消息提示', categoryId: 5, order: 2 }
    ]);
    console.log(`创建了 ${components.length} 个组件`);

    // 创建初始组件文档数据
    console.log('正在创建初始组件文档数据...');
    
    // 按钮组件文档
    const buttonDoc = await ComponentDoc.create({
      componentId: 1, // 对应button组件
      title: '按钮组件',
      description: '用于触发操作的按钮组件',
      usage: '按钮组件用于响应用户点击行为，触发相应的业务逻辑。',
      props: [
        { name: 'type', type: 'string', default: 'default', description: '按钮类型，可选值：primary / success / warning / danger / info / text' },
        { name: 'size', type: 'string', default: 'medium', description: '按钮大小，可选值：large / medium / small / mini' },
        { name: 'disabled', type: 'boolean', default: 'false', description: '是否禁用状态' },
        { name: 'icon', type: 'string', default: '', description: '图标组件' },
        { name: 'loading', type: 'boolean', default: 'false', description: '是否加载中状态' }
      ],
      events: [
        { name: 'click', description: '点击按钮时触发', params: 'event: Event' }
      ],
      examples: [
        {
          title: '基础用法',
          description: '基础的按钮用法',
          code: '<div>\n  <el-button>默认按钮</el-button>\n  <el-button type="primary">主要按钮</el-button>\n  <el-button type="success">成功按钮</el-button>\n  <el-button type="info">信息按钮</el-button>\n  <el-button type="warning">警告按钮</el-button>\n  <el-button type="danger">危险按钮</el-button>\n</div>'
        },
        {
          title: '禁用状态',
          description: '按钮不可用状态',
          code: '<div>\n  <el-button disabled>默认按钮</el-button>\n  <el-button type="primary" disabled>主要按钮</el-button>\n  <el-button type="success" disabled>成功按钮</el-button>\n</div>'
        }
      ],
      markdownContent: `# 按钮组件\n\n用于触发操作的按钮组件\n\n## 使用场景\n\n按钮组件用于响应用户点击行为，触发相应的业务逻辑。\n\n## 属性\n\n| 属性名 | 类型 | 默认值 | 说明 |\n| ------ | ---- | ------ | ---- |\n| type | string | default | 按钮类型，可选值：primary / success / warning / danger / info / text |\n| size | string | medium | 按钮大小，可选值：large / medium / small / mini |\n| disabled | boolean | false | 是否禁用状态 |\n| icon | string | | 图标组件 |\n| loading | boolean | false | 是否加载中状态 |\n\n## 事件\n\n| 事件名 | 说明 | 参数 |\n| ------ | ---- | ---- |\n| click | 点击按钮时触发 | event: Event |\n\n## 示例\n\n### 基础用法\n\n基础的按钮用法\n\n\`\`\`html\n<div>\n  <el-button>默认按钮</el-button>\n  <el-button type="primary">主要按钮</el-button>\n  <el-button type="success">成功按钮</el-button>\n  <el-button type="info">信息按钮</el-button>\n  <el-button type="warning">警告按钮</el-button>\n  <el-button type="danger">危险按钮</el-button>\n</div>\n\`\`\`\n\n### 禁用状态\n\n按钮不可用状态\n\n\`\`\`html\n<div>\n  <el-button disabled>默认按钮</el-button>\n  <el-button type="primary" disabled>主要按钮</el-button>\n  <el-button type="success" disabled>成功按钮</el-button>\n</div>\n\`\`\``
    });

    // 输入框组件文档
    const inputDoc = await ComponentDoc.create({
      componentId: 4, // 对应input组件
      title: '输入框组件',
      description: '用于输入内容的表单组件',
      usage: '输入框组件用于接收用户的文本输入，是最基础的表单域组件。',
      props: [
        { name: 'type', type: 'string', default: 'text', description: '类型，可选值：text / textarea / password / number / email / url / date' },
        { name: 'value / v-model', type: 'string / number', default: '', description: '绑定值' },
        { name: 'placeholder', type: 'string', default: '', description: '输入框占位文本' },
        { name: 'disabled', type: 'boolean', default: 'false', description: '是否禁用' },
        { name: 'clearable', type: 'boolean', default: 'false', description: '是否可清空' }
      ],
      events: [
        { name: 'input', description: '在 Input 值改变时触发', params: 'value: string | number' },
        { name: 'change', description: '仅在输入框失去焦点或用户按下回车时触发', params: 'value: string | number' },
        { name: 'focus', description: '在 Input 获得焦点时触发', params: 'event: Event' },
        { name: 'blur', description: '在 Input 失去焦点时触发', params: 'event: Event' }
      ],
      examples: [
        {
          title: '基础用法',
          description: '基础的输入框用法',
          code: '<el-input v-model="input" placeholder="请输入内容"></el-input>'
        },
        {
          title: '禁用状态',
          description: '通过 disabled 属性指定是否禁用 input 组件',
          code: '<el-input v-model="input" disabled placeholder="请输入内容"></el-input>'
        },
        {
          title: '可清空',
          description: '使用 clearable 属性即可得到一个可清空的输入框',
          code: '<el-input v-model="input" clearable placeholder="请输入内容"></el-input>'
        }
      ],
      markdownContent: `# 输入框组件\n\n用于输入内容的表单组件\n\n## 使用场景\n\n输入框组件用于接收用户的文本输入，是最基础的表单域组件。\n\n## 属性\n\n| 属性名 | 类型 | 默认值 | 说明 |\n| ------ | ---- | ------ | ---- |\n| type | string | text | 类型，可选值：text / textarea / password / number / email / url / date |\n| value / v-model | string / number | | 绑定值 |\n| placeholder | string | | 输入框占位文本 |\n| disabled | boolean | false | 是否禁用 |\n| clearable | boolean | false | 是否可清空 |\n\n## 事件\n\n| 事件名 | 说明 | 参数 |\n| ------ | ---- | ---- |\n| input | 在 Input 值改变时触发 | value: string \| number |\n| change | 仅在输入框失去焦点或用户按下回车时触发 | value: string \| number |\n| focus | 在 Input 获得焦点时触发 | event: Event |\n| blur | 在 Input 失去焦点时触发 | event: Event |\n\n## 示例\n\n### 基础用法\n\n基础的输入框用法\n\n\`\`\`html\n<el-input v-model="input" placeholder="请输入内容"></el-input>\n\`\`\`\n\n### 禁用状态\n\n通过 disabled 属性指定是否禁用 input 组件\n\n\`\`\`html\n<el-input v-model="input" disabled placeholder="请输入内容"></el-input>\n\`\`\`\n\n### 可清空\n\n使用 clearable 属性即可得到一个可清空的输入框\n\n\`\`\`html\n<el-input v-model="input" clearable placeholder="请输入内容"></el-input>\n\`\`\``
    });

    console.log(`创建了 ${await ComponentDoc.count()} 个组件文档`);
    console.log('数据库初始化完成！');

    return { success: true, message: '数据库初始化成功' };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return { success: false, message: '数据库初始化失败', error: error.message };
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initDatabase()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('初始化过程中发生错误:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };