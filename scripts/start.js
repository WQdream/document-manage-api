#!/usr/bin/env node

/**
 * 组件文档系统API服务启动脚本
 */

const app = require('../src/index');
const http = require('http');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 获取端口
const port = normalizePort(process.env.PORT || '3000');

// 创建HTTP服务器
const server = http.createServer(app);

// 启动服务器
async function startServer() {
  try {
    // 同步数据库
    await app.dbSync();
    
    // 监听指定端口，使用0.0.0.0监听所有网络接口
    server.listen(port, '0.0.0.0');
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

/**
 * 规范化端口为数字、字符串或false
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // 命名的管道
    return val;
  }

  if (port >= 0) {
    // 端口号
    return port;
  }

  return false;
}

/**
 * HTTP服务器"error"事件的事件监听器
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // 处理特定的监听错误，并提供友好的错误消息
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' 需要提升权限');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' 已被占用');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * HTTP服务器"listening"事件的事件监听器
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('组件文档API服务已启动，监听在 ' + bind);
  console.log(`API地址: http://localhost:${addr.port}/api`);
  
  // 显示局域网访问地址
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过非IPv4和内部地址
      if (iface.family !== 'IPv4' || iface.internal) {
        continue;
      }
      console.log(`局域网访问地址: http://${iface.address}:${addr.port}/api`);
    }
  }
}