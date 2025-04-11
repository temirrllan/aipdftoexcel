// src/pages/Upload.jsx
import React, { useState, useEffect } from 'react'
import styles from '../styles/Upload.module.scss'
import AddKeywordModal from '../components/AddKeywordModal'
import ExcelJS from 'exceljs'
import { useLazyGetKeywordsQuery, useAddKeywordMutation } from '../features/keywords/keywordsApi'

const Upload = () => {
  // Состояния для файла, таблицы, Excel, загрузки и ошибок
  const [file, setFile] = useState(null)
  const [tableData, setTableData] = useState([])
  const [excelFile, setExcelFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
 // Состояние для статистики контрагентов
 const [contragentStats, setContragentStats] = useState([])
  // Состояния для модального окна добавления ключевых слов
  const [showModal, setShowModal] = useState(false)

  // Локально храним массив правил (локально добавленные)
  const [patterns, setPatterns] = useState([])

  // RTK Query: lazy-запрос для получения ключевых слов из базы
  const [fetchKeywords] = useLazyGetKeywordsQuery()
  // RTK Query: мутация для добавления нового ключевого слова в базу
  const [addKeyword] = useAddKeywordMutation()


   // Новое состояние для статистики
   const [statsData, setStatsData] = useState([])
  // Функция при нажатии кнопки «Показать по контрагентам»
  const handleShowContragentStats = () => {
    const stats = aggregateContragent(tableData)
    setContragentStats(stats)
  }
    // Функция, вызываемая при нажатии кнопки "Показать статистику"
  const handleShowStats = () => {
    // Создаём агрегатную таблицу
    const aggregated = aggregateKeywords(tableData)
    setStatsData(aggregated)
  }
  // При монтировании загружаем данные из Local Storage для текущего пользователя
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      const savedTable = localStorage.getItem(`tableData_${userId}`)
      if (savedTable) {
        setTableData(JSON.parse(savedTable))
      }
      const savedExcel = localStorage.getItem(`excelFile_${userId}`)
      if (savedExcel) {
        setExcelFile(savedExcel)
      }
      const savedPatterns = localStorage.getItem(`patterns_${userId}`)
      if (savedPatterns) {
        setPatterns(JSON.parse(savedPatterns))
      }
    }
  }, [])

  // Обработчики загрузки файла
  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('pdfFile', file)

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Ошибка загрузки файла')
      }
      const data = await response.json()
      setTableData(data.tableData)
      setExcelFile(data.excelFile)

      const userId = localStorage.getItem('userId')
      if (userId) {
        localStorage.setItem(`tableData_${userId}`, JSON.stringify(data.tableData))
        localStorage.setItem(`excelFile_${userId}`, data.excelFile)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (tableData.length === 0) return

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    tableData.forEach((row) => {
      worksheet.addRow(row)
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'output.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Открыть и закрыть модальное окно
  const openModal = () => setShowModal(true)
  const closeModal = () => setShowModal(false)

  // При добавлении нового правила через модальное окно:
  // Вызываем addKeyword-мутейшн, чтобы сохранить правило в базе, затем обновляем локальное состояние.
  const onKeywordSaved = async (pattern, category) => {
    try {
      // Сохраняем в базе: API ожидает объект { pattern, category_name }
      await addKeyword({ pattern, category_name: category }).unwrap()

      // После успешного сохранения получаем обновлённый список ключевых слов из базы
      const result = await fetchKeywords().unwrap()
      // Объединяем с локальными правилами, если нужно (но здесь можно заменить локальные правила на данные из базы)
      const dbPatterns = result.map((kw) => ({
        pattern: kw.pattern,
        category: kw.category_name,
      }))
      // Обновляем локальное состояние
      setPatterns(dbPatterns)
      const userId = localStorage.getItem('userId')
      if (userId) {
        localStorage.setItem(`patterns_${userId}`, JSON.stringify(dbPatterns))
      }
      // Применяем обновленные правила к таблице
      const updatedTable = applyKeywordsToTable(tableData, dbPatterns)
      setTableData(updatedTable)
      if (userId) {
        localStorage.setItem(`tableData_${userId}`, JSON.stringify(updatedTable))
      }
      setShowModal(false)
    } catch (err) {
      console.error('Ошибка добавления ключевого слова в базу:', err)
    }
  }

  // При нажатии на кнопку "По вашим критериям" запускаем lazy-запрос для получения ключевых слов из базы
  const handleApplyDefault = async () => {
    try {
      const result = await fetchKeywords().unwrap() // Получаем массив правил из базы
      const dbPatterns = result.map((kw) => ({
        pattern: kw.pattern,
        category: kw.category_name,
      }))
      // Объединяем с локальными правилами (если они есть) без дубликатов
      const mergedPatterns = [
        ...patterns,
        ...dbPatterns.filter(
          (dbKw) =>
            !patterns.some(
              (p) =>
                p.pattern.toLowerCase() === dbKw.pattern.toLowerCase() &&
                p.category.toLowerCase() === dbKw.category.toLowerCase()
            )
        ),
      ]
      setPatterns(mergedPatterns)
      const updatedTable = applyKeywordsToTable(tableData, mergedPatterns)
      setTableData(updatedTable)
      const userId = localStorage.getItem('userId')
      if (userId) {
        localStorage.setItem(`tableData_${userId}`, JSON.stringify(updatedTable))
        localStorage.setItem(`patterns_${userId}`, JSON.stringify(mergedPatterns))
      }
    } catch (err) {
      console.error('Ошибка применения ключевых слов:', err)
    }
  }

  return (
    <div className={styles.uploadContainer}>
      <h1>Загрузка PDF и конвертация в Excel</h1>
      <div className={styles.formGroup}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={isLoading}>
          {isLoading ? 'Обработка...' : 'Загрузить'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {tableData.length > 0 && (
        <div className={styles.result}>
          {/* Новая кнопка для показа статистики по контрагентам */}
          <button onClick={handleShowContragentStats}>
            Статистика по контрагентам
          </button>
        </div>
      )}
      {tableData.length > 0 && (
        <div className={styles.result}>
          <button onClick={handleDownload}>Скачать Excel</button>
          <button onClick={openModal}>Добавить ключевое слово</button>
          <button onClick={handleApplyDefault}>По вашим критериям</button>
          <button onClick={handleShowStats}>Показать статистику</button>
          <table className={styles.table}>
            <thead>
              <tr>
                {tableData[0].map((cell, index) => (
                  <th key={index}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
{/* Если есть данные для статистики, показываем вторую таблицу */}
{statsData.length > 0 && (
        <div className={styles.statsContainer}>
          <h2>Статистика по ключевым словам</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Назначение</th>
                <th>Операции</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {statsData.map((row, index) => (
                <tr key={index}>
                  <td>{row.keyword}</td>
                  <td>{row.operations}</td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

{contragentStats.length > 0 && (
        <div className={styles.statsContainer}>
          <h2>Операции по поступлению</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Контрагент</th>
                <th>Операции</th>
                <th>Сумма операций</th>
                <th>Доля</th>
              </tr>
            </thead>
            <tbody>
              {contragentStats.map((row, index) => (
                <tr key={index}>
                  <td>{row.contragent}</td>
                  <td>{row.count}</td>
                  <td>{formatMoney(row.total)}</td>
                  <td>{row.share.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <AddKeywordModal onClose={closeModal} onSaved={onKeywordSaved} />
      )}
    </div>
  )
}

// Функция, которая добавляет/обновляет столбец "Ключевое слово" в tableData
function applyKeywordsToTable(originalTable, patterns) {
  if (originalTable.length === 0) return originalTable

  // Глубокое копирование таблицы
  const table = JSON.parse(JSON.stringify(originalTable))
  const headerRow = table[0]
  
  // Ищем столбец "назначение платежа"
  let destinationIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('назначение платежа')
  )
  if (destinationIndex === -1) return table

  // Проверяем, существует ли уже столбец "Ключевое слово"
  let keywordIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('ключевое слово')
  )
  if (keywordIndex === -1) {
    keywordIndex = destinationIndex + 1
    headerRow.splice(keywordIndex, 0, 'Ключевое слово')
    for (let i = 1; i < table.length; i++) {
      table[i].splice(keywordIndex, 0, '')
    }
  }

  // Для каждой строки данных собираем все совпадения
  for (let i = 1; i < table.length; i++) {
    const row = table[i]
    const paymentText = (row[destinationIndex] || '').toLowerCase()
    const matchedCategories = [] // массив для хранения найденных ключевых слов

    for (let p of patterns) {
      if (paymentText.includes(p.pattern.toLowerCase())) {
        matchedCategories.push(p.category)
      }
    }
    // Объединяем найденные категории через запятую (или можно выбрать другой разделитель)
    row[keywordIndex] = matchedCategories.join(', ')
  }

  return table
}
// Функция, которая агрегирует данные из столбцов "Ключевое слово" и "Сумма"
function aggregateKeywords(tableData) {
  if (tableData.length < 2) return [];

  // Ищем индексы столбцов "Ключевое слово" и "Сумма"
  const headerRow = tableData[0];
  const keywordIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('ключевое слово')
  );
  const sumIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('сумма')
  );

  if (keywordIndex === -1 || sumIndex === -1) {
    return [];
  }

  const aggregator = {};

  // Перебираем строки данных (начиная со второй строки)
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];
    const keywordCell = row[keywordIndex] || '';
    const sumCell = row[sumIndex] || '0';

    const numericValue = parseFloat(
      sumCell.toString().replace(/\s+/g, '').replace(',', '.')
    );
    const amount = isNaN(numericValue) ? 0 : numericValue;

    // Допускаем, что может быть несколько ключевых слов, разделённых запятой
    const keywordsArr = keywordCell
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k !== '');

    keywordsArr.forEach((kw) => {
      if (!aggregator[kw]) {
        aggregator[kw] = { count: 0, total: 0 };
      }
      aggregator[kw].count += 1;
      aggregator[kw].total += amount;
    });
  }

  const result = Object.entries(aggregator).map(([keyword, data]) => ({
    keyword,
    operations: data.count,
    total: data.total,
  }));

  // Сортируем по количеству операций от большего к меньшему
  result.sort((a, b) => b.operations - a.operations);
  
  return result;
}

function aggregateContragent(tableData) {
  if (tableData.length < 2) return []

  // Ищем индексы нужных столбцов
  const headerRow = tableData[0]
  const contragentIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('наименование получателя')
  )
  const sumIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('сумма')
  )

  if (contragentIndex === -1 || sumIndex === -1) {
    // Не нашли нужные столбцы, возвращаем пусто
    return []
  }

  // Агрегатор вида { 'ТОО Иванов': { count: 0, total: 0 }, ... }
  const aggregator = {}

  // Перебираем строки данных
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i]
    const contragentName = row[contragentIndex] || ''
    const sumCell = row[sumIndex] || '0'

    // Парсим сумму (убираем пробелы, заменяем запятую на точку)
    const numericValue = parseFloat(
      sumCell.toString().replace(/\s+/g, '').replace(',', '.')
    )
    const amount = isNaN(numericValue) ? 0 : numericValue

    if (!aggregator[contragentName]) {
      aggregator[contragentName] = { count: 0, total: 0 }
    }
    aggregator[contragentName].count += 1
    aggregator[contragentName].total += amount
  }

  // Превращаем aggregator в массив
  let result = Object.entries(aggregator).map(([contragent, data]) => ({
    contragent,
    count: data.count,
    total: data.total,
  }))

  // Находим общий итог, чтобы вычислить долю
  const grandTotal = result.reduce((acc, obj) => acc + obj.total, 0)

  // Вычисляем share = (obj.total / grandTotal) * 100
  result.forEach((obj) => {
    obj.share = grandTotal > 0 ? (obj.total / grandTotal) * 100 : 0
  })

  // Можно отсортировать, например, по total (убывание)
  result.sort((a, b) => b.total - a.total)

  return result
}

// Пример форматирования суммы (можно использовать Intl.NumberFormat)
function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
export default Upload
