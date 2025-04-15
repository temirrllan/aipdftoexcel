// backend/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware'); // Подключаем middleware авторизации

// Создаем экземпляр multer (файлы остаются в памяти)
const upload = multer();

// Импортируем контроллер
const { convertPdf } = require('../controllers/uploadController');

// Применяем authMiddleware к маршруту, чтобы req.user был определён для авторизованных пользователей
router.post('/', authMiddleware, upload.single('pdfFile'), convertPdf);

module.exports = router;
