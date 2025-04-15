// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());

// Подключение маршрутов
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const keywordsRoutes = require('./routes/keywords');
const assignmentKeywordsRoutes = require('./routes/assignmentKeywords');

app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/keywords', keywordsRoutes);
app.use('/assignment_keywords', assignmentKeywordsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
