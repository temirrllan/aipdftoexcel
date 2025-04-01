// src/pages/Upload.jsx
import React, { useState, useEffect } from 'react'
import styles from '../styles/Upload.module.scss'
import AddKeywordModal from '../components/AddKeywordModal'
import ExcelJS from 'exceljs'

const Upload = () => {
  // Состояния
  const [file, setFile] = useState(null)
  const [tableData, setTableData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Модальное окно для добавления ключевых слов
  const [showModal, setShowModal] = useState(false)

  // Локально храним массив правил (pattern -> category)
  const [patterns, setPatterns] = useState([])

  // Загружаем сохранённые данные из Local Storage при монтировании компонента
  useEffect(() => {
    const savedTable = localStorage.getItem('tableData')
    if (savedTable) {
      setTableData(JSON.parse(savedTable))
    }
    const savedPatterns = localStorage.getItem('patterns')
    if (savedPatterns) {
      setPatterns(JSON.parse(savedPatterns))
    }
  }, [])

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
      // Сохраняем в Local Storage, чтобы не потерять данные при обновлении страницы
      localStorage.setItem('tableData', JSON.stringify(data.tableData))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Функция генерации Excel на клиенте из обновлённого tableData
  const handleDownload = async () => {
    if (tableData.length === 0) return

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    // Добавляем строки таблицы в рабочий лист
    tableData.forEach((row) => {
      worksheet.addRow(row)
    })

    // Генерируем буфер Excel-файла
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

  // Открыть модальное окно
  const openModal = () => {
    setShowModal(true)
  }

  // Закрыть модальное окно
  const closeModal = () => {
    setShowModal(false)
  }

  // Функция, вызываемая после добавления нового правила в модалке
  const onKeywordSaved = (pattern, category) => {
    // Обновляем массив правил
    const newPatterns = [...patterns, { pattern, category }]
    setPatterns(newPatterns)
    localStorage.setItem('patterns', JSON.stringify(newPatterns))

    // Пересчитываем столбец "Ключевое слово" на основе новых правил
    const updatedTable = applyKeywordsToTable(tableData, newPatterns)
    setTableData(updatedTable)
    localStorage.setItem('tableData', JSON.stringify(updatedTable))

    // Закрываем модальное окно
    setShowModal(false)
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
          <button onClick={handleDownload}>Скачать Excel</button>
          <button onClick={openModal}>Добавить ключевое слово</button>

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

      {showModal && (
        <AddKeywordModal onClose={closeModal} onSaved={onKeywordSaved} />
      )}
    </div>
  )
}

// Функция, которая добавляет/обновляет столбец "Ключевое слово" в tableData
function applyKeywordsToTable(originalTable, patterns) {
  if (originalTable.length === 0) return originalTable

  // Глубокое копирование таблицы, чтобы не мутировать исходные данные
  const table = JSON.parse(JSON.stringify(originalTable))

  // Находим индекс столбца "назначение платежа"
  const headerRow = table[0]
  let destinationIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('назначение платежа')
  )

  if (destinationIndex === -1) {
    // Если не найден, возвращаем исходную таблицу
    return table
  }

  // Проверяем, существует ли уже столбец "ключевое слово"
  let keywordIndex = headerRow.findIndex((cell) =>
    cell.toLowerCase().includes('ключевое слово')
  )

  if (keywordIndex === -1) {
    // Если нет, вставляем новый столбец сразу после "назначение платежа"
    keywordIndex = destinationIndex + 1
    headerRow.splice(keywordIndex, 0, 'Ключевое слово')

    // В каждой строке данных добавляем пустую ячейку для нового столбца
    for (let i = 1; i < table.length; i++) {
      table[i].splice(keywordIndex, 0, '')
    }
  }

  // Обновляем столбец "Ключевое слово" для каждой строки данных
  for (let i = 1; i < table.length; i++) {
    const row = table[i]
    const paymentText = (row[destinationIndex] || '').toLowerCase()
    let matchedCategory = ''
    for (let p of patterns) {
      if (paymentText.includes(p.pattern.toLowerCase())) {
        matchedCategory = p.category
        break
      }
    }
    row[keywordIndex] = matchedCategory
  }

  return table
}

export default Upload
