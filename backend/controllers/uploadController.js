// controllers/uploadController.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ExcelJS = require('exceljs');

exports.convertPdf = (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'Файл не загружен' });
  }
  const userId = req.user.userId;
  // Сохраняем загруженный PDF во временный файл
  const tempPath = path.join(__dirname, '..', 'temp.pdf');
  fs.writeFileSync(tempPath, req.file.buffer);

  // Запускаем Python-скрипт, передавая путь к PDF
  const pyProcess = spawn('python', ['parse_pdf.py', tempPath]);

  let dataString = '';
  let errorString = '';

  pyProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pyProcess.stderr.on('data', (err) => {
    errorString += err.toString();
  });

  pyProcess.on('close', async (code) => {
    // Удаляем временный файл
    fs.unlinkSync(tempPath);

    if (code !== 0) {
      console.error('Ошибка Python:', errorString);
      return res.status(500).send({
        error: 'Ошибка в Python-скрипте',
        details: errorString,
      });
    }

    let tableData;
    try {
      // tableData – массив строк, каждая строка – массив ячеек
      tableData = JSON.parse(dataString);
    } catch (e) {
      console.error('Ошибка парсинга JSON из Python:', e);
      return res.status(500).send({ error: 'Некорректные данные от Python' });
    }

    // --- Отладочный вывод ---
    console.log('ВСЕ СТРОКИ ДО ФИЛЬТРАЦИИ:');
    tableData.forEach((row, idx) => {
      console.log(`Строка #${idx}:`, row);
    });

    // ================== Шаг 0: Фильтруем нежелательные строки ==================
    const filteredData = tableData.filter((row) => {
      const rowText = row.map(cell => cell.trim()).join(' ').toLowerCase();

      // Удаляем строку "1 2 3 4 5 6 7 8 9"
      if (rowText === '1 2 3 4 5 6 7 8 9') {
        return false;
      }
      // Удаляем строки "итого обороты..." или "итого операций..."
      if (rowText.includes('итого обороты') || rowText.includes('итого операций')) {
        return false;
      }
      return true;
    });

    if (filteredData.length === 0) {
      return res.send({
        tableData: [],
        excelFile: null,
      });
    }

    // Вспомогательная функция для «чистки» заголовков
    function cleanHeaderRow(row) {
      return row.map(cell =>
        cell.replace(/\n/g, ' ').trim().toLowerCase()
      );
    }

    // ================== Шаг 1: Удаляем столбец "Номер документа" ==================
    {
      const headerRow = cleanHeaderRow(filteredData[0]);
      filteredData[0] = headerRow;
      const docColIndex = headerRow.findIndex(cell =>
        cell.includes('номер документа')
      );
      if (docColIndex !== -1) {
        filteredData.forEach(row => {
          row.splice(docColIndex, 1);
        });
      }
    }

    // ================== Шаг 2: Удаляем время из "Дата операции" ==================
    {
      const headerRow = cleanHeaderRow(filteredData[0]);
      filteredData[0] = headerRow;
      const dateColIndex = headerRow.findIndex(cell =>
        cell.includes('дата операции')
      );
      if (dateColIndex !== -1) {
        for (let i = 1; i < filteredData.length; i++) {
          let cellValue = filteredData[i][dateColIndex];
          if (typeof cellValue === 'string') {
            cellValue = cellValue.replace(/\n/g, ' ').trim();
            const splitted = cellValue.split(' ');
            filteredData[i][dateColIndex] = splitted[0]; // Оставляем только дату
          }
        }
      }
    }

    // ================== Шаг 3: "Кредит - Дебет" => "сумма" (вместо Кредита) ==================
    // ОТКЛЮЧЕНО: Пока функция не нужна. Комментарий ниже оставлен для возможного будущего использования.
    /*
    {
      const headerRow = cleanHeaderRow(filteredData[0]);
      filteredData[0] = headerRow;
      let debetIndex = headerRow.findIndex(cell => cell.includes('дебет'));
      let creditIndex = headerRow.findIndex(cell => cell.includes('кредит'));
      if (debetIndex !== -1 && creditIndex !== -1) {
        if (creditIndex < debetIndex) {
          [creditIndex, debetIndex] = [debetIndex, creditIndex];
        }
        // Переименовываем столбец "Кредит" -> "сумма"
        filteredData[0][creditIndex] = 'сумма';
        function parseNum(val) {
          if (!val) return 0;
          val = val.replace(/\s+/g, '').replace(',', '.');
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        }
        for (let i = 1; i < filteredData.length; i++) {
          const row = filteredData[i];
          const d = parseNum(row[debetIndex]);
          const c = parseNum(row[creditIndex]);
          const result = c - d;
          row[creditIndex] = result.toString();
        }
        // Удаляем столбец "Дебет" из каждой строки, чтобы оставить только столбец "сумма"
        filteredData.forEach(row => {
          row.splice(debetIndex, 1);
        });
      }
    }
    */

    // ================== Шаг 4: "Наименование получателя" + выносим БИН/ИИН ==================
    {
      const headerRow = cleanHeaderRow(filteredData[0]);
      filteredData[0] = headerRow;
      const recipientIndex = headerRow.findIndex(cell =>
        cell.includes('наименование получателя')
      );
      if (recipientIndex !== -1) {
        filteredData[0][recipientIndex] = 'наименование получателя';
        filteredData[0].splice(recipientIndex + 1, 0, 'бин/иин');
        const binRegex = /б[иi]н\/[иi]ин\s*\d+/i;
        for (let i = 1; i < filteredData.length; i++) {
          const row = filteredData[i];
          row.splice(recipientIndex + 1, 0, '');
          let cellValue = row[recipientIndex];
          if (typeof cellValue === 'string') {
            const match = cellValue.match(binRegex);
            if (match) {
              row[recipientIndex + 1] = match[0];
              const newText = cellValue.replace(match[0], '').trim();
              row[recipientIndex] = newText;
            }
          }
        }
      }
    }

    // ================== Шаг 5: Удаляем столбец "иик бенеф" ==================
    {
      const headerRow = cleanHeaderRow(filteredData[0]);
      filteredData[0] = headerRow;
      const iikIndex = headerRow.findIndex(cell =>
        cell.includes('иик бенеф')
      );
      if (iikIndex !== -1) {
        filteredData.forEach(row => {
          row.splice(iikIndex, 1);
        });
      }
    }

    // ================== Шаг 6: Удаляем столбец "БИК банка получателя (отправителя денег)" ==================
    {
      const headerRow = cleanHeaderRow(filteredData[0]);
      filteredData[0] = headerRow;
      const bikIndex = headerRow.findIndex(cell =>
        cell.includes('бик банка')
      );
      if (bikIndex !== -1) {
        filteredData.forEach(row => {
          row.splice(bikIndex, 1);
        });
      }
    }

    // ================== Генерация Excel ==================
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      filteredData.forEach((row) => {
        worksheet.addRow(row);
      });
      const excelBuffer = await workbook.xlsx.writeBuffer();
      return res.send({
        tableData: filteredData,
        excelFile: excelBuffer.toString('base64'),
      });
    } catch (e) {
      console.error('Ошибка генерации Excel:', e);
      return res.status(500).send({ error: 'Ошибка при создании Excel' });
    }
  });
};
