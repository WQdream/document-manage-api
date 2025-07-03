const { ComponentDoc, Component } = require('../models');

// 获取所有组件文档
exports.getAllComponentDocs = async (req, res) => {
  try {
    const docs = await ComponentDoc.findAll({
      include: [{
        model: Component,
        as: 'component',
        attributes: ['id', 'componentId', 'name']
      }]
    });
    res.json(docs);
  } catch (error) {
    console.error('获取组件文档失败:', error);
    res.status(500).json({ message: '获取组件文档失败', error: error.message });
  }
};

// 获取单个组件文档
exports.getComponentDocById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ComponentDoc.findByPk(id, {
      include: [{
        model: Component,
        as: 'component',
        attributes: ['id', 'componentId', 'name']
      }]
    });

    if (!doc) {
      return res.status(404).json({ message: '组件文档不存在' });
    }

    res.json(doc);
  } catch (error) {
    console.error('获取组件文档详情失败:', error);
    res.status(500).json({ message: '获取组件文档详情失败', error: error.message });
  }
};

// 根据组件ID获取文档
exports.getDocByComponentId = async (req, res) => {
  try {
    const { componentId } = req.params;
    
    // 先查找组件
    const component = await Component.findOne({
      where: { componentId }
    });

    if (!component) {
      return res.status(404).json({ message: '组件不存在' });
    }

    // 查找组件文档
    const doc = await ComponentDoc.findOne({
      where: { componentId: component.id },
      include: [{
        model: Component,
        as: 'component',
        attributes: ['id', 'componentId', 'name']
      }]
    });

    if (!doc) {
      return res.status(404).json({ message: '组件文档不存在' });
    }

    res.json(doc);
  } catch (error) {
    console.error('获取组件文档详情失败:', error);
    res.status(500).json({ message: '获取组件文档详情失败', error: error.message });
  }
};

// 创建组件文档
exports.createComponentDoc = async (req, res) => {
  try {
    const { componentId, title, description, usage, props, events, examples, markdownContent } = req.body;

    if (!componentId) {
      return res.status(400).json({ message: '组件ID不能为空' });
    }

    // 检查组件是否存在
    const component = await Component.findByPk(componentId);
    if (!component) {
      return res.status(404).json({ message: '组件不存在' });
    }

    // 检查文档是否已存在
    const existingDoc = await ComponentDoc.findOne({ where: { componentId } });
    if (existingDoc) {
      return res.status(400).json({ message: '该组件已有文档' });
    }

    // 创建文档
    const doc = await ComponentDoc.create({
      componentId,
      title: title || component.name,
      description: description || '',
      usage: usage || '',
      props: props || [],
      events: events || [],
      examples: examples || [],
      markdownContent: markdownContent || ''
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('创建组件文档失败:', error);
    res.status(500).json({ message: '创建组件文档失败', error: error.message });
  }
};

// 更新组件文档
exports.updateComponentDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const doc = await ComponentDoc.findByPk(id);
    if (!doc) {
      return res.status(404).json({ message: '组件文档不存在' });
    }

    // 更新字段
    doc.title = updateData.title || doc.title;
    doc.description = updateData.description || doc.description;
    doc.usage = updateData.usage || doc.usage;
    
    // 如果提供了markdownContent字段，直接使用它
    if (updateData.markdownContent) {
      doc.markdownContent = updateData.markdownContent;
    }
    
    // 更新结构化数据
    if (updateData.props) doc.props = updateData.props;
    if (updateData.events) doc.events = updateData.events;
    if (updateData.examples) doc.examples = updateData.examples;

    await doc.save();
    res.json(doc);
  } catch (error) {
    console.error('更新组件文档失败:', error);
    res.status(500).json({ message: '更新组件文档失败', error: error.message });
  }
};

// 删除组件文档
exports.deleteComponentDoc = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await ComponentDoc.findByPk(id);

    if (!doc) {
      return res.status(404).json({ message: '组件文档不存在' });
    }

    await doc.destroy();

    res.json({ message: '组件文档删除成功' });
  } catch (error) {
    console.error('删除组件文档失败:', error);
    res.status(500).json({ message: '删除组件文档失败', error: error.message });
  }
};

// 导入Markdown文档
exports.importMarkdown = async (req, res) => {
  try {
    const { componentId, markdownContent } = req.body;

    if (!componentId || !markdownContent) {
      return res.status(400).json({ message: '组件ID和Markdown内容不能为空' });
    }

    // 检查组件是否存在
    const component = await Component.findOne({ where: { componentId } });
    
    if (!component) {
      return res.status(404).json({ message: '指定的组件不存在' });
    }
    
    // 查找或创建组件文档
    let doc = await ComponentDoc.findOne({ where: { componentId: component.id } });

    if (doc) {
      // 更新现有文档，只保存markdownContent
      doc.markdownContent = markdownContent;
      
      // 从文档中提取标题作为组件文档标题
      const titleMatch = markdownContent.match(/^# (.+)$/m);
      if (titleMatch && titleMatch[1]) {
        doc.title = titleMatch[1];
      }
      
      await doc.save();
    } else {
      // 从文档中提取标题作为组件文档标题
      let title = component.name;
      const titleMatch = markdownContent.match(/^# (.+)$/m);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1];
      }
      
      // 创建新文档，只设置必要的字段
      doc = await ComponentDoc.create({
        componentId: component.id,
        title: title,
        description: '',
        usage: '',
        props: [],
        events: [],
        examples: [],
        markdownContent
      });
    }

    res.json(doc);
  } catch (error) {
    console.error('导入Markdown文档失败:', error);
    res.status(500).json({ message: '导入Markdown文档失败', error: error.message });
  }
};

// 导出Markdown文档
exports.exportMarkdown = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ComponentDoc.findByPk(id, {
      include: [{
        model: Component,
        as: 'component',
        attributes: ['id', 'componentId', 'name']
      }]
    });

    if (!doc) {
      return res.status(404).json({ message: '组件文档不存在' });
    }

    // 如果已有Markdown内容，直接返回
    if (doc.markdownContent) {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename=${doc.component.componentId}.md`);
      return res.send(doc.markdownContent);
    }

    // 否则生成Markdown内容
    const markdown = generateMarkdownContent(doc);

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename=${doc.component.componentId}.md`);
    res.send(markdown);
  } catch (error) {
    console.error('导出Markdown文档失败:', error);
    res.status(500).json({ message: '导出Markdown文档失败', error: error.message });
  }
};

// 辅助函数：解析Markdown内容
function parseMarkdownContent(markdown) {
  try {
    const doc = {
      title: '',
      description: '',
      usage: '',
      props: [],
      events: [],
      examples: []
    };

    const lines = markdown.split('\n');
    let section = '';
    let example = null;
    let foundTitle = false;
    let foundDescription = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('# ')) {
        doc.title = line.substring(2);
        foundTitle = true;
        continue;
      }

      // 只要还没遇到"## 使用场景"，并且不是空行，就是description
      if (foundTitle && !foundDescription && !line.startsWith('##') && line !== '') {
        doc.description += (doc.description ? '\n' : '') + line;
        continue;
      }
      if (line.startsWith('## 使用场景')) {
        section = 'usage';
        foundDescription = true;
        continue;
      }
      if (line.startsWith('## 属性')) {
        section = 'props';
        i += 2; // 跳过表头和分隔行
        continue;
      }
      if (line.startsWith('## 事件')) {
        section = 'events';
        i += 2; // 跳过表头和分隔行
        continue;
      }
      if (line.startsWith('## 示例')) {
        section = 'examples';
        continue;
      }
      if (line.startsWith('### ') && section === 'examples') {
        if (example) {
          doc.examples.push(example);
        }
        example = {
          title: line.substring(4),
          description: '',
          code: ''
        };
        continue;
      }
      if (line.startsWith('```') && section === 'examples' && example) {
        let code = '';
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          code += lines[i] + '\n';
          i++;
        }
        example.code = code.trim();
        continue;
      }
      if (section === 'usage' && !line.startsWith('##')) {
        if (line && !line.startsWith('#')) {
          doc.usage += line + '\n';
        }
        continue;
      }
      if (section === 'props' && line.startsWith('|') && !line.startsWith('| --')) {
        const parts = line.split('|').filter(p => p.trim()).map(p => p.trim());
        if (parts.length >= 4) {
          doc.props.push({
            name: parts[0],
            type: parts[1],
            default: parts[2],
            description: parts[3]
          });
        }
        continue;
      }
      if (section === 'events' && line.startsWith('|') && !line.startsWith('| --')) {
        const parts = line.split('|').filter(p => p.trim()).map(p => p.trim());
        if (parts.length >= 3) {
          doc.events.push({
            name: parts[0],
            description: parts[1],
            params: parts[2]
          });
        }
        continue;
      }
      if (section === 'examples' && example && !line.startsWith('```') && !line.startsWith('###')) {
        if (line) {
          example.description += line + '\n';
        }
        continue;
      }
    }

    // 添加最后一个示例
    if (example) {
      doc.examples.push(example);
    }

    // 清理多余换行
    doc.description = doc.description.trim();
    doc.usage = doc.usage.trim();
    doc.examples.forEach(ex => {
      ex.description = ex.description.trim();
    });

    return doc;
  } catch (error) {
    console.error('解析Markdown失败:', error);
    return {
      title: '',
      description: '',
      usage: '',
      props: [],
      events: [],
      examples: []
    };
  }
}

// 辅助函数：生成Markdown内容
function generateMarkdownContent(doc) {
  let md = `# ${doc.title}\n\n`;
  md += `${doc.description}\n\n`;
  md += `## 使用场景\n\n${doc.usage}\n\n`;
  
  md += `## 属性\n\n`;
  md += `| 属性名 | 类型 | 默认值 | 说明 |\n`;
  md += `| ------ | ---- | ------ | ---- |\n`;
  doc.props.forEach(prop => {
    md += `| ${prop.name} | ${prop.type} | ${prop.default} | ${prop.description} |\n`;
  });
  md += '\n';
  
  md += `## 事件\n\n`;
  md += `| 事件名 | 说明 | 参数 |\n`;
  md += `| ------ | ---- | ---- |\n`;
  doc.events.forEach(event => {
    md += `| ${event.name} | ${event.description} | ${event.params} |\n`;
  });
  md += '\n';
  
  md += `## 示例\n\n`;
  doc.examples.forEach(example => {
    md += `### ${example.title}\n\n`;
    md += `${example.description}\n\n`;
    md += '```html\n';
    md += `${example.code}\n`;
    md += '```\n\n';
  });
  
  return md;
}