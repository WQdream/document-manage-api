const { RouteTable, RouteRecord, MigrationSession, Sequelize, sequelize } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class MigrationController {
  // 创建迁移会话
  async createSession(req, res) {
    try {
      const { name, sourceTableId, targetTableId, description } = req.body;

      if (!name || !sourceTableId || !targetTableId) {
        return res.status(400).json({
          success: false,
          message: '请提供完整的会话信息'
        });
      }

      // 验证表是否存在
      const sourceTable = await RouteTable.findByPk(sourceTableId);
      const targetTable = await RouteTable.findByPk(targetTableId);

      if (!sourceTable || !targetTable) {
        return res.status(404).json({
          success: false,
          message: '源表或目标表不存在'
        });
      }

      const session = await MigrationSession.create({
        name,
        sourceTableId,
        targetTableId,
        description
      });

      res.json({
        success: true,
        message: '迁移会话创建成功',
        data: session
      });
    } catch (error) {
      console.error('创建迁移会话失败:', error);
      res.status(500).json({
        success: false,
        message: '创建迁移会话失败',
        error: error.message
      });
    }
  }

  // 获取迁移会话列表
  async getSessions(req, res) {
    try {
      const sessions = await MigrationSession.findAll({
        include: [
          { model: RouteTable, as: 'sourceTable', attributes: ['id', 'name', 'type'] },
          { model: RouteTable, as: 'targetTable', attributes: ['id', 'name', 'type'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('获取迁移会话失败:', error);
      res.status(500).json({
        success: false,
        message: '获取迁移会话失败',
        error: error.message
      });
    }
  }

  // 获取迁移对比数据
  async getComparisonData(req, res) {
    try {
      const { sessionId } = req.params;
      const { page = 1, pageSize = 50, search, showSelected, showSelectableOnly, moduleFilter, advancedFilter } = req.query;

      const session = await MigrationSession.findByPk(sessionId, {
        include: [
          { model: RouteTable, as: 'sourceTable' },
          { model: RouteTable, as: 'targetTable' }
        ]
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: '迁移会话不存在'
        });
      }

      // 构建查询条件
      const whereClause = { tableId: session.sourceTableId };
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { title: { [Op.like]: `%${search}%` } },
          { path: { [Op.like]: `%${search}%` } },
          { moduleName: { [Op.like]: `%${search}%` } }
        ];
      }
      if (showSelected === 'true') {
        whereClause.isSelected = true;
      }
      if (moduleFilter) {
        if (moduleFilter === '') {
          // 筛选空模块名称
          whereClause.moduleName = { [Op.or]: [null, ''] };
        } else {
          whereClause.moduleName = moduleFilter;
        }
      }

      // 获取目标表中已存在的记录（用于比对）
      const targetRecords = await RouteRecord.findAll({
        where: { tableId: session.targetTableId },
        attributes: ['routeId']
      });

      // 创建目标表记录的映射，用于快速查找（只使用routeId作为key）
      const targetRouteIds = new Set();
      targetRecords.forEach(record => {
        // 只使用routeId作为判断依据
        const routeId = record.routeId;
        if (routeId !== null && routeId !== undefined && routeId !== '') {
          targetRouteIds.add(String(routeId).toLowerCase()); // 转为字符串并小写
        }
      });

      // 如果需要只显示可选择的记录，添加额外的查询条件
      if (showSelectableOnly === 'true') {
        // 获取所有源记录的routeId，然后排除已存在的
        const allSourceRecords = await RouteRecord.findAll({
          where: whereClause,
          attributes: ['routeId'],
          order: [['rowIndex', 'ASC']]
        });
        
        const selectableRouteIds = allSourceRecords
          .filter(record => {
            const routeId = record.routeId;
            if (routeId === null || routeId === undefined || routeId === '') {
              return true; // 空ID的记录认为是可选择的
            }
            return !targetRouteIds.has(String(routeId).toLowerCase());
          })
          .map(record => record.routeId);
        
        // 添加routeId筛选条件
        if (selectableRouteIds.length > 0) {
          whereClause.routeId = { [Op.in]: selectableRouteIds };
        } else {
          // 如果没有可选择的记录，返回空结果
          whereClause.routeId = { [Op.in]: [] };
        }
      }

      const offset = (page - 1) * pageSize;
      const { count, rows: sourceRecords } = await RouteRecord.findAndCountAll({
        where: whereClause,
        limit: parseInt(pageSize),
        offset: offset,
        order: [['rowIndex', 'ASC']]
      });

      // 解析高级过滤配置
      let parsedAdvancedFilter = null;
      if (advancedFilter) {
        try {
          parsedAdvancedFilter = typeof advancedFilter === 'string' ? JSON.parse(advancedFilter) : advancedFilter;
        } catch (error) {
          console.error('解析高级过滤配置失败:', error);
        }
      }

      // 如果启用了高级过滤，需要获取目标表的完整记录进行详细比对
      let targetRecordsForComparison = [];
      if (parsedAdvancedFilter && parsedAdvancedFilter.enabled) {
        targetRecordsForComparison = await RouteRecord.findAll({
          where: { tableId: session.targetTableId }
        });
      }

      // 为源记录添加比对信息
      const enrichedRecords = sourceRecords.map(record => {
        let existsInTarget = false;
        let canUpdate = false;
        let conflictInfo = null;

        if (parsedAdvancedFilter && parsedAdvancedFilter.enabled) {
          // 高级过滤模式：根据配置的字段进行比对
          const matchingRecord = targetRecordsForComparison.find(targetRecord => {
            // 检查必须相同的字段
            return parsedAdvancedFilter.sameFields.every(field => {
              const sourceValue = record[field];
              const targetValue = targetRecord[field];
              return String(sourceValue || '').toLowerCase() === String(targetValue || '').toLowerCase();
            });
          });

          if (matchingRecord) {
            existsInTarget = true;
            
            // 检查允许不同的字段是否真的不同
            const hasDifferences = parsedAdvancedFilter.differentFields.some(field => {
              const sourceValue = record[field];
              const targetValue = matchingRecord[field];
              return String(sourceValue || '') !== String(targetValue || '');
            });

            if (hasDifferences) {
              canUpdate = true; // 有差异，可以更新
            }

            conflictInfo = {
              matchingRecord: matchingRecord.toJSON(),
              differences: parsedAdvancedFilter.differentFields.filter(field => {
                const sourceValue = record[field];
                const targetValue = matchingRecord[field];
                return String(sourceValue || '') !== String(targetValue || '');
              })
            };
          }
        } else {
          // 简单模式：只使用routeId进行比对
          const routeId = record.routeId;
          if (routeId !== null && routeId !== undefined && routeId !== '') {
            existsInTarget = targetRouteIds.has(String(routeId).toLowerCase());
          }
          conflictInfo = existsInTarget ? { routeId } : null;
        }
        
        return {
          ...record.toJSON(),
          existsInTarget,
          canUpdate,
          conflictInfo
        };
      });

      res.json({
        success: true,
        data: {
          session: session.toJSON(),
          sourceRecords: enrichedRecords,
          pagination: {
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(count / pageSize)
          }
        }
      });
    } catch (error) {
      console.error('获取对比数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取对比数据失败',
        error: error.message
      });
    }
  }

  // 批量选择/取消选择记录
  async toggleSelection(req, res) {
    try {
      const { sessionId } = req.params;
      const { recordIds, selected } = req.body;

      if (!Array.isArray(recordIds)) {
        return res.status(400).json({
          success: false,
          message: '记录ID必须是数组'
        });
      }

      const session = await MigrationSession.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: '迁移会话不存在'
        });
      }

      // 更新记录选择状态
      await RouteRecord.update(
        { isSelected: selected },
        {
          where: {
            id: { [Op.in]: recordIds },
            tableId: session.sourceTableId
          }
        }
      );

      // 更新会话的选中计数
      const selectedCount = await RouteRecord.count({
        where: {
          tableId: session.sourceTableId,
          isSelected: true
        }
      });

      await session.update({ selectedCount });

      res.json({
        success: true,
        message: '选择状态更新成功',
        data: { selectedCount }
      });
    } catch (error) {
      console.error('更新选择状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新选择状态失败',
        error: error.message
      });
    }
  }

  // 执行迁移
  async executeMigration(req, res) {
    try {
      const { sessionId } = req.params;
      const { overwriteConflicts = false } = req.body;

      const session = await MigrationSession.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: '迁移会话不存在'
        });
      }

      // 获取选中的源记录
      const selectedRecords = await RouteRecord.findAll({
        where: {
          tableId: session.sourceTableId,
          isSelected: true
        }
      });

      if (selectedRecords.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请先选择要迁移的记录'
        });
      }

      // 准备迁移的记录
      const recordsToMigrate = selectedRecords.map(record => ({
        tableId: session.targetTableId,
        routeId: record.routeId,
        parentId: record.parentId,
        name: record.name,
        path: record.path,
        title: record.title,
        icon: record.icon,
        notCache: record.notCache,
        hideInMenu: record.hideInMenu,
        component: record.component,
        redirect: record.redirect,
        order: record.order,
        src: record.src,
        keyRule: record.keyRule,
        isActive: record.isActive,
        moduleId: record.moduleId,
        nav: record.nav,
        type: record.type,
        moduleName: record.moduleName,
        model: record.model,
        word: record.word,
        sourceRecordId: record.id,
        rowIndex: record.rowIndex
      }));

      let migratedCount = 0;
      let skippedCount = 0;

      for (const recordData of recordsToMigrate) {
        // 检查是否已存在 - 只使用routeId判断
        const existing = await RouteRecord.findOne({
          where: {
            tableId: session.targetTableId,
            routeId: recordData.routeId
          }
        });

        if (existing) {
          if (overwriteConflicts) {
            await existing.update(recordData);
            migratedCount++;
          } else {
            skippedCount++;
          }
        } else {
          await RouteRecord.create(recordData);
          migratedCount++;
        }
      }

      // 更新目标表的总行数
      const targetTable = await RouteTable.findByPk(session.targetTableId);
      const newTotalRows = await RouteRecord.count({
        where: { tableId: session.targetTableId }
      });
      await targetTable.update({ totalRows: newTotalRows });

      // 更新会话状态
      await session.update({ status: 'completed' });

      res.json({
        success: true,
        message: '迁移完成',
        data: {
          migratedCount,
          skippedCount,
          totalSelected: selectedRecords.length
        }
      });
    } catch (error) {
      console.error('执行迁移失败:', error);
      res.status(500).json({
        success: false,
        message: '执行迁移失败',
        error: error.message
      });
    }
  }

  // 导出标准表为Excel
  async exportTable(req, res) {
    try {
      const { tableId } = req.params;

      const table = await RouteTable.findByPk(tableId);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: '路由表不存在'
        });
      }

      const records = await RouteRecord.findAll({
        where: { tableId },
        order: [['rowIndex', 'ASC']]
      });

      // 直接从记录中获取原始数据

      // 处理数据，优先使用原始数据
      let excelData = [];
      
      // 格式化日期函数
      const formatDate = (date) => {
        if (!date) return null;
        return date.toISOString().replace('T', ' ').substring(0, 19);
      };
      
      for (const record of records) {
        try {
          // 如果有原始数据，使用原始数据，但不包括时间字段
          if (record.rawData) {
            const rawData = JSON.parse(record.rawData);
            // 删除原始数据中的时间字段，将使用数据库中的时间
            delete rawData.created_at;
            delete rawData.updated_at;
            delete rawData.deleted_at;
            
            // 添加数据库中的时间字段
            rawData.created_at = formatDate(record.createdAt);
            rawData.updated_at = formatDate(record.updatedAt);
            if (record.deletedAt) {
              rawData.deleted_at = formatDate(record.deletedAt);
            }
            
            excelData.push(rawData);
          } else {
            // 如果没有原始数据，使用转换后的数据
            // 使用统一的日期格式化函数
            const createdAt = formatDate(record.createdAt);
            const updatedAt = formatDate(record.updatedAt);
            const deletedAt = formatDate(record.deletedAt);
            
            excelData.push({
              'id': record.routeId,
              'parent_id': record.parentId,
              'name': record.name,
              'path': record.path,
              'title': record.title,
              'icon': record.icon,
              'not_cache': record.notCache,
              'hide_in_menu': record.hideInMenu,
              'component': record.component,
              'redirect': record.redirect,
              'order': record.order,
              'src': record.src,
              'created_at': createdAt,
              'updated_at': updatedAt,
              'key_rule': record.keyRule,
              'deleted_at': deletedAt,
              'is_active': record.isActive,
              'module_id': record.moduleId,
              'nav': record.nav,
              'type': record.type,
              '模块名称': record.moduleName,
              'model': record.model,
              'word': record.word
            });
          }
        } catch (e) {
          console.error('解析原始数据失败:', e);
          // 如果解析失败，使用转换后的数据
          // 使用统一的日期格式化函数
          const createdAt = formatDate(record.createdAt);
          const updatedAt = formatDate(record.updatedAt);
          const deletedAt = formatDate(record.deletedAt);
          
          excelData.push({
            'id': record.routeId,
            'parent_id': record.parentId,
            'name': record.name,
            'path': record.path,
            'title': record.title,
            'icon': record.icon,
            'not_cache': record.notCache,
            'hide_in_menu': record.hideInMenu,
            'component': record.component,
            'redirect': record.redirect,
            'order': record.order,
            'src': record.src,
            'created_at': createdAt,
            'updated_at': updatedAt,
            'key_rule': record.keyRule,
            'deleted_at': deletedAt,
            'is_active': record.isActive,
            'module_id': record.moduleId,
            'nav': record.nav,
            'type': record.type,
            '模块名称': record.moduleName,
            'model': record.model,
            'word': record.word
          });
        }
      }

      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 将日期字段转为字符串，避免Excel自动转换
      excelData.forEach(row => {
        // 确保日期字段是字符串格式
        if (row['created_at']) {
          row['created_at'] = String(row['created_at']);
        }
        if (row['updated_at']) {
          row['updated_at'] = String(row['updated_at']);
        }
        if (row['deleted_at']) {
          row['deleted_at'] = String(row['deleted_at']);
        }
      });
      
      // 创建主工作表
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 检查是否有多个工作表需要导出
      let allSheetsData = null;
      if (table.allSheets) {
        try {
          allSheetsData = JSON.parse(table.allSheets);
        } catch (e) {
          console.error('解析多工作表数据失败:', e);
        }
      }
      
      // 设置合适的列宽（wch单位约等于字符宽度）
      const columnWidths = [
        { wch: 19 },  // id - 路由ID (16→19)
        { wch: 19 },  // parent_id - 父级ID (18→19)
        { wch: 18 },  // name - 路由名称
        { wch: 25 },  // path - 路由路径
        { wch: 18 },  // title - 显示标题
        { wch: 12 },  // icon - 图标
        { wch: 10 },  // not_cache - 不缓存
        { wch: 12 },  // hide_in_menu - 隐藏菜单
        { wch: 20 },  // component - 组件路径
        { wch: 20 },  // redirect - 重定向
        { wch: 8 },   // order - 排序
        { wch: 15 },  // src - 源文件
        { wch: 18 },  // created_at - 创建时间
        { wch: 18 },  // updated_at - 更新时间
        { wch: 25 },  // key_rule - 权限规则
        { wch: 18 },  // deleted_at - 删除时间
        { wch: 10 },  // is_active - 是否激活
        { wch: 19 },  // module_id - 模块ID (16→19)
        { wch: 12 },  // nav - 导航类型
        { wch: 12 },  // type - 路由类型
        { wch: 15 },  // 模块名称
        { wch: 12 },  // model - 模型
        { wch: 30 }   // word - 描述文字
      ];
      
      // 应用列宽设置
      worksheet['!cols'] = columnWidths;
      
      // 冻结首行（表头）
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
      
      // 添加自动筛选
      if (excelData.length > 0) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        worksheet['!autofilter'] = { ref: worksheet['!ref'] };
      }
      
      // 按照原始顺序添加所有工作表
      if (allSheetsData && allSheetsData.sheets && allSheetsData.sheets.length > 0) {
        // 处理第一个工作表（主工作表）
        const firstSheetName = allSheetsData.sheets[0];
        XLSX.utils.book_append_sheet(workbook, worksheet, firstSheetName);
        
        // 处理其他工作表
        for (let i = 1; i < allSheetsData.sheets.length; i++) {
          const sheetName = allSheetsData.sheets[i];
          if (allSheetsData.data[sheetName] && Array.isArray(allSheetsData.data[sheetName])) {
            // 处理日期格式
            const sheetData = allSheetsData.data[sheetName].map(row => {
              const newRow = {...row};
              if (newRow['created_at']) newRow['created_at'] = String(newRow['created_at']);
              if (newRow['updated_at']) newRow['updated_at'] = String(newRow['updated_at']);
              if (newRow['deleted_at']) newRow['deleted_at'] = String(newRow['deleted_at']);
              return newRow;
            });
            
            // 创建工作表
            const additionalWorksheet = XLSX.utils.json_to_sheet(sheetData);
            // 为额外工作表设置统一较宽的列宽
            try {
              const rng = XLSX.utils.decode_range(additionalWorksheet['!ref'] || 'A1:A1');
              const colsCount = Math.max(1, (rng.e.c - rng.s.c + 1));
              const defaultWch = 20; // 统一宽一些
              additionalWorksheet['!cols'] = Array.from({ length: colsCount }, () => ({ wch: defaultWch }));
            } catch (e) {
              // 忽略列宽计算异常，继续导出
            }
            // 添加到工作簿
            XLSX.utils.book_append_sheet(workbook, additionalWorksheet, sheetName);
          }
        }
      } else {
        // 如果没有多工作表数据，使用默认名称
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Routes');
      }

      // 生成文件名
      const fileName = `${table.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const filePath = path.join(__dirname, '../../temp', fileName);

      // 确保temp目录存在
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 手动设置日期列的单元格格式为文本
      const dateColumns = ['created_at', 'updated_at', 'deleted_at'];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1000');
      
      // 获取列名到列索引的映射
      const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
      const columnMap = {};
      headerRow.forEach((header, index) => {
        columnMap[header] = index;
      });
      
      // 设置日期列的格式为文本
      dateColumns.forEach(colName => {
        if (columnMap[colName] !== undefined) {
          const colIndex = columnMap[colName];
          for (let r = range.s.r + 1; r <= range.e.r; r++) {
            const cellRef = XLSX.utils.encode_cell({ r, c: colIndex });
            if (worksheet[cellRef]) {
              worksheet[cellRef].t = 's'; // 设置为字符串类型
            }
          }
        }
      });
      
      // 写入文件
      XLSX.writeFile(workbook, filePath, { 
        bookSST: true,
        type: 'file'
      });

      // 设置响应头并发送文件
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // 文件发送完成后删除临时文件
      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });

    } catch (error) {
      console.error('导出Excel失败:', error);
      res.status(500).json({
        success: false,
        message: '导出Excel失败',
        error: error.message
      });
    }
  }

  // 获取模块选项列表
  async getModuleOptions(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await MigrationSession.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: '迁移会话不存在'
        });
      }

      // 获取源表中所有不重复的模块名称
      const modules = await RouteRecord.findAll({
        where: { tableId: session.sourceTableId },
        attributes: ['moduleName'],
        group: ['moduleName'],
        order: [['moduleName', 'ASC']]
      });

      // 提取模块名称并过滤空值
      const moduleNames = modules
        .map(record => record.moduleName)
        .filter(name => name !== null && name !== undefined)
        .sort();

      res.json({
        success: true,
        data: moduleNames
      });
    } catch (error) {
      console.error('获取模块选项失败:', error);
      res.status(500).json({
        success: false,
        message: '获取模块选项失败',
        error: error.message
      });
    }
  }

  // 删除迁移会话
  async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await MigrationSession.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: '迁移会话不存在'
        });
      }

      // 删除会话（软删除）
      await session.destroy();

      res.json({
        success: true,
        message: '迁移会话删除成功'
      });
    } catch (error) {
      console.error('删除迁移会话失败:', error);
      res.status(500).json({
        success: false,
        message: '删除迁移会话失败',
        error: error.message
      });
    }
  }
}

module.exports = new MigrationController();