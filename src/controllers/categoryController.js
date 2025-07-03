const { Category, Component } = require('../models');

// 获取所有分类
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['order', 'ASC'], ['name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ message: '获取分类失败', error: error.message });
  }
};

// 获取单个分类及其组件
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [{
        model: Component,
        as: 'components',
        order: [['order', 'ASC'], ['name', 'ASC']]
      }]
    });

    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }

    res.json(category);
  } catch (error) {
    console.error('获取分类详情失败:', error);
    res.status(500).json({ message: '获取分类详情失败', error: error.message });
  }
};

// 创建新分类
exports.createCategory = async (req, res) => {
  try {
    const { name, order } = req.body;

    if (!name) {
      return res.status(400).json({ message: '分类名称不能为空' });
    }

    const newCategory = await Category.create({
      name,
      order: order || 0
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ message: '创建分类失败', error: error.message });
  }
};

// 更新分类
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }

    if (name) category.name = name;
    if (order !== undefined) category.order = order;

    await category.save();

    res.json(category);
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ message: '更新分类失败', error: error.message });
  }
};

// 删除分类
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }

    // 检查是否有组件关联到此分类
    const componentsCount = await Component.count({ where: { categoryId: id } });

    if (componentsCount > 0) {
      return res.status(400).json({ 
        message: '无法删除此分类，因为它包含组件',
        componentsCount
      });
    }

    await category.destroy();

    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ message: '删除分类失败', error: error.message });
  }
};

// 获取菜单结构（包含所有分类及其组件）
exports.getMenuStructure = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{
        model: Component,
        as: 'components',
        order: [['order', 'ASC'], ['name', 'ASC']]
      }],
      order: [['order', 'ASC'], ['name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    console.error('获取菜单结构失败:', error);
    res.status(500).json({ message: '获取菜单结构失败', error: error.message });
  }
};