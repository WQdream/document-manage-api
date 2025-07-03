# 组件文档系统 API

这是组件文档系统的后端 API 服务，提供组件分类、组件和组件文档的管理功能。

## 技术栈

- Node.js
- Express
- MySQL
- Sequelize ORM

## 安装与配置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（已创建），配置以下环境变量：

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=component_docs
NODE_ENV=development
```

### 3. 初始化数据库

```bash
node src/config/init-db.js
```

### 4. 启动服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

## API 接口

### 分类管理

- `GET /api/categories` - 获取所有分类
- `GET /api/categories/:id` - 获取单个分类及其组件
- `POST /api/categories` - 创建新分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类
- `GET /api/menu` - 获取完整菜单结构

### 组件管理

- `GET /api/components` - 获取所有组件
- `GET /api/components/:id` - 获取单个组件
- `GET /api/components/by-component-id/:componentId` - 根据组件ID获取组件
- `POST /api/components` - 创建新组件
- `PUT /api/components/:id` - 更新组件
- `DELETE /api/components/:id` - 删除组件

### 组件文档管理

- `GET /api/component-docs` - 获取所有组件文档
- `GET /api/component-docs/:id` - 获取单个组件文档
- `GET /api/component-docs/by-component-id/:componentId` - 根据组件ID获取文档
- `POST /api/component-docs` - 创建新组件文档
- `PUT /api/component-docs/:id` - 更新组件文档
- `DELETE /api/component-docs/:id` - 删除组件文档
- `POST /api/component-docs/import` - 导入Markdown文档
- `GET /api/component-docs/:id/export` - 导出Markdown文档

## 数据库模型

### Category (分类)

```
id: 主键
name: 分类名称
order: 排序顺序
createdAt: 创建时间
updatedAt: 更新时间
```

### Component (组件)

```
id: 主键
componentId: 组件唯一标识符
name: 组件名称
categoryId: 所属分类ID
order: 排序顺序
createdAt: 创建时间
updatedAt: 更新时间
```

### ComponentDoc (组件文档)

```
id: 主键
componentId: 关联的组件ID
title: 文档标题
description: 组件描述
usage: 使用场景
props: 属性列表 (JSON)
events: 事件列表 (JSON)
examples: 示例列表 (JSON)
markdownContent: Markdown格式的文档内容
createdAt: 创建时间
updatedAt: 更新时间
```

## 前后端集成

前端项目需要配置API基础URL，可以在前端项目的环境配置文件中添加：

```
VITE_API_BASE_URL=http://localhost:3000/api
```

然后在前端代码中使用axios或fetch调用API接口。