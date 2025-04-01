// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ExcelJS = require('exceljs');

// Создаем приложение express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const upload = multer();

// Подключаем маршруты
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const keywordsRoutes = require('./routes/keywords');

// Регистрируем маршруты
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/keywords', keywordsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
