// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Создаем экземпляр multer (без сохранения файла на диск — файлы остаются в памяти)
const upload = multer();

// Импортируем контроллер
const { convertPdf } = require('../controllers/uploadController');

// Определяем маршрут для POST-запроса на /upload
router.post('/', upload.single('pdfFile'), convertPdf);

module.exports = router;
