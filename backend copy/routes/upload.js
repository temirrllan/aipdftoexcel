// backend/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ApiError } = require('../utils/ApiError');
const authMiddleware = require('../middlewares/authMiddleware');
const { convertPdf } = require('../controllers/uploadController');

// Настройка multer: храним в памяти, ограничиваем размер и проверяем MIME
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // максимум 10 МБ
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      // Если не PDF — возвращаем ошибку через ApiError
      return cb(new ApiError(400, 'Допустим только формат PDF'), false);
    }
    cb(null, true);
  },
});

// POST /upload
// — требует авторизации, принимает single file 'pdfFile'
router.post(
  '/',
  authMiddleware,
  upload.single('pdfFile'),
  convertPdf
);

module.exports = router;
