const { OperationLog } = require('../models');
const { Op } = require('sequelize');

// 获取所有操作日志
exports.getAllLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const where = {};
    
    // 按操作类型筛选
    if (type) {
      where.operationType = type;
    }
    
    // 按日期范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }
    
    // 查询数据
    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ message: '获取操作日志失败', error: error.message });
  }
};

// 获取单个操作日志详情
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await OperationLog.findByPk(id);
    
    if (!log) {
      return res.status(404).json({ message: '操作日志不存在' });
    }
    
    res.json(log);
  } catch (error) {
    console.error('获取操作日志详情失败:', error);
    res.status(500).json({ message: '获取操作日志详情失败', error: error.message });
  }
};

// 删除操作日志（通常只有管理员可以操作）
exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await OperationLog.findByPk(id);
    
    if (!log) {
      return res.status(404).json({ message: '操作日志不存在' });
    }
    
    await log.destroy();
    res.json({ message: '操作日志删除成功' });
  } catch (error) {
    console.error('删除操作日志失败:', error);
    res.status(500).json({ message: '删除操作日志失败', error: error.message });
  }
};

// 批量删除操作日志
exports.batchDeleteLogs = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '请提供有效的日志ID列表' });
    }
    
    await OperationLog.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
    
    res.json({ message: '批量删除操作日志成功' });
  } catch (error) {
    console.error('批量删除操作日志失败:', error);
    res.status(500).json({ message: '批量删除操作日志失败', error: error.message });
  }
};

// 清空特定日期之前的日志
exports.clearLogsBefore = async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: '请提供有效的日期' });
    }
    
    await OperationLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: new Date(date)
        }
      }
    });
    
    res.json({ message: '清空指定日期前的日志成功' });
  } catch (error) {
    console.error('清空日志失败:', error);
    res.status(500).json({ message: '清空日志失败', error: error.message });
  }
}; 