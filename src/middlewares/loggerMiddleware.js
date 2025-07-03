const { OperationLog } = require('../models');
const os = require('os');

/**
 * 获取本机的IPv4地址
 * @returns {string} 本机IPv4地址
 */
function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  let ipAddress = '';
  
  // 遍历所有网络接口
  Object.keys(interfaces).forEach((ifname) => {
    interfaces[ifname].forEach((iface) => {
      // 只获取IPv4地址，且不是内部地址(127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
      }
    });
  });
  
  return ipAddress || '未能获取本机IP';
}

// 缓存本机IP地址，避免重复计算
const localIPv4 = getLocalIPv4();

/**
 * 记录操作日志的中间件
 * @param {string} operationType 操作类型
 * @returns {Function} 中间件函数
 */
const logOperation = (operationType) => {
  return async (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法，以便在成功响应后记录日志
    res.json = function(data) {
      // 如果是成功的响应（状态码小于400），则记录操作日志
      if (res.statusCode < 400) {
        // 获取客户端IP - 修正获取IP的逻辑
        let operatorIp = '未知IP';
        
        // 尝试从各种可能的请求头和属性中获取IP
        if (req.headers['x-forwarded-for']) {
          // 如果经过代理，x-forwarded-for可能包含多个IP，取第一个
          const forwardedIps = req.headers['x-forwarded-for'].split(',');
          operatorIp = forwardedIps[0].trim();
        } else if (req.headers['x-real-ip']) {
          operatorIp = req.headers['x-real-ip'];
        } else if (req.connection && req.connection.remoteAddress) {
          operatorIp = req.connection.remoteAddress;
        } else if (req.socket && req.socket.remoteAddress) {
          operatorIp = req.socket.remoteAddress;
        } else if (req.ip) {
          operatorIp = req.ip;
        }
        
        // 处理IPv6格式的IP地址（如::1或::ffff:127.0.0.1）
        if (operatorIp.includes('::ffff:')) {
          operatorIp = operatorIp.replace('::ffff:', '');
        }
        
        // 如果是本地回环地址，则使用本机的真实IPv4地址
        if (operatorIp === '::1' || operatorIp === '127.0.0.1') {
          operatorIp = localIPv4;
        }
        
        // 获取操作目标信息
        let targetId = null;
        let targetName = null;
        
        // 根据不同操作类型获取目标ID和名称
        if (operationType.includes('CATEGORY')) {
          targetId = req.params.id || (data && data.id) || null;
          targetName = data && data.name ? data.name : null;
        } else if (operationType.includes('COMPONENT')) {
          targetId = req.params.id || (data && data.id) || null;
          targetName = data && data.name ? data.name : null;
        } else if (operationType.includes('DOC')) {
          targetId = req.params.id || (data && data.id) || null;
          targetName = data && data.title ? data.title : null;
        }
        
        // 记录操作内容 - 简化为仅包含必要信息
        let operationContent = '';
        
        if (operationType.includes('CREATE_DOC')) {
          // 创建文档时只记录标题
          operationContent = req.body.title ? `创建文档: ${req.body.title}` : '创建新文档';
        } else if (operationType.includes('UPDATE_DOC')) {
          // 更新文档时只记录标题
          operationContent = `更新文档: ${targetName || '未命名文档'}`;
        } else if (operationType.includes('DELETE_DOC')) {
          // 删除文档时记录文档ID和标题
          operationContent = `删除文档: ${targetName || '未命名文档'}`;
        } else if (operationType.includes('IMPORT_DOC')) {
          // 导入文档时记录组件ID
          const componentId = req.body.componentId;
          operationContent = `导入文档: ${componentId}`;
        } else if (operationType.includes('EXPORT_DOC')) {
          // 导出文档时记录文档ID
          operationContent = `导出文档: ${req.params.id || req.params.componentId}`;
        } else if (operationType.includes('CREATE_CATEGORY')) {
          // 创建分类时记录分类名称
          operationContent = req.body.name ? `创建分类: ${req.body.name}` : '创建新分类';
        } else if (operationType.includes('UPDATE_CATEGORY')) {
          // 更新分类时记录分类名称
          operationContent = `更新分类: ${targetName || '未命名分类'}`;
        } else if (operationType.includes('DELETE_CATEGORY')) {
          // 删除分类时记录分类ID和名称
          operationContent = `删除分类: ${targetName || '未命名分类'}`;
        } else if (operationType.includes('CREATE_COMPONENT')) {
          // 创建组件时记录组件名称
          operationContent = req.body.name ? `创建组件: ${req.body.name}` : '创建新组件';
        } else if (operationType.includes('UPDATE_COMPONENT')) {
          // 更新组件时记录组件名称
          operationContent = `更新组件: ${targetName || '未命名组件'}`;
        } else if (operationType.includes('DELETE_COMPONENT')) {
          // 删除组件时记录组件ID和名称
          operationContent = `删除组件: ${targetName || '未命名组件'}`;
        }
        
        // 创建日志记录 - 使用Promise处理异步操作
        OperationLog.create({
          operationType,
          targetId,
          targetName,
          operationContent,
          operatorIp,
          operatorInfo: req.headers['user-agent'] || '未知客户端'
        }).catch(error => {
          console.error('记录操作日志失败:', error);
          // 日志记录失败不影响主要业务流程
        });
      }
      
      // 调用原始的json方法
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  logOperation
}; 