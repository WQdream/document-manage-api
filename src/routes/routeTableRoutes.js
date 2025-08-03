const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const routeTableController = require('../controllers/routeTableController');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // 只允许Excel文件
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持Excel文件格式(.xls, .xlsx)'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 路由定义
router.get('/', routeTableController.getAllTables);
router.post('/upload', upload.single('file'), routeTableController.uploadExcel);
router.post('/:id/reimport', upload.single('file'), routeTableController.reimportExcel);
router.get('/:id', routeTableController.getTableDetail);
router.delete('/:id', routeTableController.deleteTable);

module.exports = router;