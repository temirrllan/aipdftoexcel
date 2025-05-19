// controllers/uploadController.js
const fs            = require('fs');
const path          = require('path');
const { spawn }     = require('child_process');
const ExcelJS       = require('exceljs');
const asyncHandler  = require('express-async-handler');
const { classifyRow } = require('../services/aiService');

/**
 * Конвертация PDF в JSON + Excel, с AI-классификацией строк
 */
exports.convertPdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  // Сохраняем PDF во временный файл
  const tempPath = path.join(__dirname, '..', 'temp.pdf');
  fs.writeFileSync(tempPath, req.file.buffer);

  // Запускаем Python-скрипт, возвращающий JSON-таблицу
  const dataString = await new Promise((resolve, reject) => {
    const py = spawn('python', ['parse_pdf.py', tempPath]);
    let out = '', err = '';

    py.stdout.on('data', chunk => (out += chunk));
    py.stderr.on('data', chunk => (err += chunk));

    py.on('close', code => {
      // удаляем временный файл
      fs.unlinkSync(tempPath);
      if (code !== 0) return reject(new Error(err || 'Python error'));
      resolve(out);
    });
  });

  // Парсим строку в массив строк таблицы
  let tableData;
  try {
    tableData = JSON.parse(dataString);
  } catch (e) {
    console.error('Ошибка парсинга JSON:', e);
    return res.status(500).json({ error: 'Некорректные данные от Python' });
  }

  // Шаг 0: фильтрация ненужных строк
  let filteredData = tableData.filter(row => {
    const txt = row.map(c => String(c).trim()).join(' ').toLowerCase();
    if (txt === '1 2 3 4 5 6 7 8 9') return false;
    if (txt.includes('итого обороты') || txt.includes('итого операций')) return false;
    return true;
  });

  if (filteredData.length < 2) {
    return res.json({ tableData: [], excelFile: null });
  }

  // Добавляем AI-колонку в заголовок
  filteredData[0].push('AI_keyword');

  // Применяем классификацию к каждой строке, кроме заголовка
  for (let i = 1; i < filteredData.length; i++) {
    try {
      const { keyword } = await classifyRow(filteredData[i]);
      filteredData[i].push(keyword);
    } catch (err) {
      console.error('AI classification error:', err);
      filteredData[i].push('');
    }
  }

  // Дальнейшая обработка заголовков и столбцов (удаление, переименование и т.д.)
  /**
   * Здесь можно вставить ваши шаги:
   * - cleanHeaderRow
   * - Шаг 1: удаление "Номер документа"
   * - Шаг 2: удаление времени из "Дата операции"
   * - Шаг 4: переименование "Наименование получателя" и вынос БИН/ИИН
   * - Шаги 5–6: удаление лишних столбцов
   */

  // Генерация Excel
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    filteredData.forEach(row => worksheet.addRow(row));
    const buffer = await workbook.xlsx.writeBuffer();
    return res.json({
      tableData: filteredData,
      excelFile: buffer.toString('base64'),
    });
  } catch (e) {
    console.error('Ошибка генерации Excel:', e);
    return res.status(500).json({ error: 'Ошибка при создании Excel' });
  }
});