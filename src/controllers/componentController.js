const { Component, Category, ComponentDoc } = require('../models');

// 获取所有组件
exports.getAllComponents = async (req, res) => {
  try {
    const components = await Component.findAll({
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['order', 'ASC'], ['name', 'ASC']]
    });
    res.json(components);
  } catch (error) {
    console.error('获取组件失败:', error);
    res.status(500).json({ message: '获取组件失败', error: error.message });
  }
};

// 获取单个组件
exports.getComponentById = async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ComponentDoc,
          as: 'doc'
        }
      ]
    });

    if (!component) {
      return res.status(404).json({ message: '组件不存在' });
    }

    res.json(component);
  } catch (error) {
    console.error('获取组件详情失败:', error);
    res.status(500).json({ message: '获取组件详情失败', error: error.message });
  }
};

// 根据componentId获取组件
exports.getComponentByComponentId = async (req, res) => {
  try {
    const { componentId } = req.params;
    const component = await Component.findOne({
      where: { componentId },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ComponentDoc,
          as: 'doc'
        }
      ]
    });

    if (!component) {
      return res.status(404).json({ message: '组件不存在' });
    }

    res.json(component);
  } catch (error) {
    console.error('获取组件详情失败:', error);
    res.status(500).json({ message: '获取组件详情失败', error: error.message });
  }
};

// 创建新组件
exports.createComponent = async (req, res) => {
  try {
    const { componentId, name, categoryId, order } = req.body;

    if (!componentId || !name || !categoryId) {
      return res.status(400).json({ message: '组件ID、名称和分类ID不能为空' });
    }

    // 检查分类是否存在
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: '指定的分类不存在' });
    }

    // 检查组件ID是否已存在
    const existingComponent = await Component.findOne({ where: { componentId } });
    if (existingComponent) {
      return res.status(400).json({ message: '组件ID已存在' });
    }

    const newComponent = await Component.create({
      componentId,
      name,
      categoryId,
      order: order || 0
    });

    res.status(201).json(newComponent);
  } catch (error) {
    console.error('创建组件失败:', error);
    res.status(500).json({ message: '创建组件失败', error: error.message });
  }
};

// 更新组件
exports.updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { componentId, name, categoryId, order } = req.body;

    const component = await Component.findByPk(id);

    if (!component) {
      return res.status(404).json({ message: '组件不存在' });
    }

    // 如果要更新componentId，检查是否与其他组件冲突
    if (componentId && componentId !== component.componentId) {
      const existingComponent = await Component.findOne({ where: { componentId } });
      if (existingComponent) {
        return res.status(400).json({ message: '组件ID已存在' });
      }
      component.componentId = componentId;
    }

    // 如果要更新分类，检查分类是否存在
    if (categoryId && categoryId !== component.categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({ message: '指定的分类不存在' });
      }
      component.categoryId = categoryId;
    }

    if (name) component.name = name;
    if (order !== undefined) component.order = order;

    await component.save();

    res.json(component);
  } catch (error) {
    console.error('更新组件失败:', error);
    res.status(500).json({ message: '更新组件失败', error: error.message });
  }
};

// 删除组件
exports.deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;

    const component = await Component.findByPk(id);

    if (!component) {
      return res.status(404).json({ message: '组件不存在' });
    }

    // 保存组件名称，用于记录日志
    const componentName = component.name;

    // 检查是否有文档关联到此组件
    const doc = await ComponentDoc.findOne({ where: { componentId: id } });

    // 如果有关联文档，一并删除
    if (doc) {
      await doc.destroy();
    }

    await component.destroy();

    // 在响应中包含组件名称，以便日志中间件可以获取
    res.json({ 
      message: '组件删除成功',
      name: componentName  // 添加组件名称到响应中
    });
  } catch (error) {
    console.error('删除组件失败:', error);
    res.status(500).json({ message: '删除组件失败', error: error.message });
  }
};