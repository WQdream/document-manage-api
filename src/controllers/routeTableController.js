const { RouteTable, RouteRecord, MigrationSession, Sequelize } = require('../models');
const { Op } = Sequelize;
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class RouteTableController {
  // 获取所有路由表
  async getAllTables(req, res) {
    try {
      const tables = await RouteTable.findAll({
        include: [{
          model: RouteRecord,
          as: 'records',
          attributes: ['id']
        }],
        order: [['createdAt', 'DESC']]
      });

      const result = tables.map(table => ({
        ...table.toJSON(),
        recordCount: table.records ? table.records.length : 0,
        records: undefined
      }));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('获取路由表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取路由表失败',
        error: error.message
      });
    }
  }

  // 上传并解析Excel文件
  async uploadExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择Excel文件'
        });
      }

      const { name, type, description } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: '请提供表名称和类型'
        });
      }

      // 读取Excel文件
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 创建路由表记录
      const routeTable = await RouteTable.create({
        name,
        type,
        description,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: jsonData.length
      });

      // 解析并保存路由记录
      const routeRecords = jsonData.map((row, index) => {
        // 安全地处理各种数据类型
        const safeString = (value, maxLength = null) => {
          if (value === null || value === undefined || value === '') return null;
          let str = String(value).trim();
          if (maxLength && str.length > maxLength) {
            str = str.substring(0, maxLength);
          }
          return str;
        };
        
        const safeBoolean = (value) => {
          if (value === null || value === undefined || value === '') return false;
          if (typeof value === 'boolean') return value;
          const str = String(value).toLowerCase().trim();
          return str === 'true' || str === '1' || str === 'yes';
        };

        return {
          tableId: routeTable.id,
          routeId: safeString(row.id, 50),
          parentId: safeString(row.parent_id, 50),
          name: safeString(row.name, 200),
          path: safeString(row.path, 500),
          title: safeString(row.title, 200),
          icon: safeString(row.icon, 200),
          notCache: safeBoolean(row.not_cache),
          hideInMenu: safeBoolean(row.hide_in_menu),
          component: safeString(row.component, 500),
          redirect: safeString(row.redirect, 500),
          order: safeString(row.order, 100),
          src: safeString(row.src, 500),
          keyRule: safeString(row.key_rule), // TEXT类型，不限制长度
          isActive: safeBoolean(row.is_active !== undefined ? row.is_active : true),
          moduleId: safeString(row.module_id, 50),
          nav: safeString(row.nav, 200),
          type: safeString(row.type, 100),
          moduleName: safeString(row['模块名称'], 200),
          model: safeString(row.model, 200),
          word: safeString(row.word), // TEXT类型，不限制长度
          rowIndex: index + 2 // Excel行号从2开始（第1行是表头）
        };
      });

      await RouteRecord.bulkCreate(routeRecords);

      // 删除临时文件
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: '文件上传成功',
        data: {
          tableId: routeTable.id,
          recordCount: jsonData.length
        }
      });
    } catch (error) {
      console.error('上传Excel失败:', error);
      // 清理临时文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: '上传Excel失败',
        error: error.message
      });
    }
  }

  // 获取路由表详情和记录
  async getTableDetail(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 50, search } = req.query;

      const table = await RouteTable.findByPk(id);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: '路由表不存在'
        });
      }

      // 构建查询条件
      const whereClause = { tableId: id };
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { title: { [Op.like]: `%${search}%` } },
          { path: { [Op.like]: `%${search}%` } },
          { moduleName: { [Op.like]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * pageSize;
      const { count, rows } = await RouteRecord.findAndCountAll({
        where: whereClause,
        limit: parseInt(pageSize),
        offset: offset,
        order: [['rowIndex', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          table: table.toJSON(),
          records: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(count / pageSize)
          }
        }
      });
    } catch (error) {
      console.error('获取路由表详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取路由表详情失败',
        error: error.message
      });
    }
  }

  // 删除路由表
  async deleteTable(req, res) {
    try {
      const { id } = req.params;

      const table = await RouteTable.findByPk(id);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: '路由表不存在'
        });
      }

      // 删除相关记录
      await RouteRecord.destroy({ where: { tableId: id } });
      await table.destroy();

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除路由表失败:', error);
      res.status(500).json({
        success: false,
        message: '删除路由表失败',
        error: error.message
      });
    }
  }

  // 重新导入Excel文件（覆盖现有数据）
  async reimportExcel(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择Excel文件'
        });
      }

      // 检查路由表是否存在
      const routeTable = await RouteTable.findByPk(id);
      if (!routeTable) {
        return res.status(404).json({
          success: false,
          message: '路由表不存在'
        });
      }

      // 读取Excel文件
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 删除该表的所有现有记录
      await RouteRecord.destroy({
        where: { tableId: id },
        force: true // 物理删除
      });

      // 解析并保存新的路由记录
      const routeRecords = jsonData.map((row, index) => {
        // 安全地处理各种数据类型
        const safeString = (value, maxLength = null) => {
          if (value === null || value === undefined || value === '') return null;
          let str = String(value).trim();
          if (maxLength && str.length > maxLength) {
            str = str.substring(0, maxLength);
          }
          return str;
        };
        
        const safeBoolean = (value) => {
          if (value === null || value === undefined || value === '') return false;
          if (typeof value === 'boolean') return value;
          const str = String(value).toLowerCase().trim();
          return str === 'true' || str === '1' || str === 'yes';
        };

        return {
          tableId: routeTable.id,
          routeId: safeString(row.id, 50),
          parentId: safeString(row.parent_id, 50),
          name: safeString(row.name, 200),
          path: safeString(row.path, 500),
          title: safeString(row.title, 200),
          icon: safeString(row.icon, 200),
          notCache: safeBoolean(row.not_cache),
          hideInMenu: safeBoolean(row.hide_in_menu),
          component: safeString(row.component, 500),
          redirect: safeString(row.redirect, 500),
          order: safeString(row.order, 100),
          src: safeString(row.src, 500),
          keyRule: safeString(row.key_rule), // TEXT类型，不限制长度
          isActive: safeBoolean(row.is_active !== undefined ? row.is_active : true),
          moduleId: safeString(row.module_id, 50),
          nav: safeString(row.nav, 200),
          type: safeString(row.type, 100),
          moduleName: safeString(row['模块名称'], 200),
          model: safeString(row.model, 200),
          word: safeString(row.word), // TEXT类型，不限制长度
          rowIndex: index + 2 // Excel行号从2开始（第1行是表头）
        };
      });

      await RouteRecord.bulkCreate(routeRecords);

      // 更新路由表信息
      await routeTable.update({
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        totalRows: jsonData.length
      });

      // 删除临时文件
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: '重新导入成功',
        data: {
          tableId: routeTable.id,
          recordCount: jsonData.length,
          oldRecordCount: routeTable.totalRows
        }
      });
    } catch (error) {
      console.error('重新导入Excel失败:', error);
      // 清理临时文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: '重新导入Excel失败',
        error: error.message
      });
    }
  }
}

module.exports = new RouteTableController();