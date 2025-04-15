// src/pages/Upload.jsx
import React, { useState, useEffect } from "react";
import styles from "../styles/Upload.module.scss";
import AddKeywordModal from "../components/AddKeywordModal";
import ExcelJS from "exceljs";
import {
  useLazyGetKeywordsQuery,
  useAddKeywordMutation,
} from "../features/keywords/keywordsApi";
import { useGetAssignmentKeywordsQuery } from "../features/assignmentKeywords/assignmentKeywordsApi";

const Upload = () => {
  // Основные состояния
  const [file, setFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Модальное окно
  const [showModal, setShowModal] = useState(false);

  // Сводные таблицы по контрагенту
  const [showSummary, setShowSummary] = useState(false);
  const [summaryPositive, setSummaryPositive] = useState([]);
  const [summaryNegative, setSummaryNegative] = useState([]);

  // Сводные таблицы по назначению платежа
  const [showAssignmentSummary, setShowAssignmentSummary] = useState(false);
  const [summaryAssignmentPositive, setSummaryAssignmentPositive] = useState([]);
  const [summaryAssignmentNegative, setSummaryAssignmentNegative] = useState([]);

  // Локальное хранение правил (например, { contragent, category })
  const [patterns, setPatterns] = useState([]);

  // RTK Query: lazy-запрос для получения правил из keywords (контрагент-based)
  const [fetchKeywords] = useLazyGetKeywordsQuery();
  // RTK Query: мутация для добавления нового правила в keywords
  const [addKeyword] = useAddKeywordMutation();

  // RTK Query: получение правил из assignment_keywords (назначение платежа)
  const { data: assignmentKeywords } = useGetAssignmentKeywordsQuery(undefined, {
    refetchOnFocus: true,
  });

  // Загрузка из localStorage при монтировании (используем ключи с суффиксом userId)
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      const savedTable = localStorage.getItem(`tableData_${userId}`);
      const savedExcel = localStorage.getItem(`excelFile_${userId}`);
      const savedPatterns = localStorage.getItem(`patterns_${userId}`);
      if (savedTable) setTableData(JSON.parse(savedTable));
      if (savedExcel) setExcelFile(savedExcel);
      if (savedPatterns) setPatterns(JSON.parse(savedPatterns));
    }
  }, []);

  // 1) Выбор файла
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // 2) Загрузка PDF
  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdfFile", file);
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Ошибка загрузки файла");
      const data = await response.json();
      const userId = localStorage.getItem("userId");
      if (userId) {
        localStorage.setItem(
          `tableData_${userId}`,
          JSON.stringify(data.tableData)
        );
        localStorage.setItem(`excelFile_${userId}`, data.excelFile);
      }
      setTableData(data.tableData);
      setExcelFile(data.excelFile);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3) Скачать Excel
  const handleDownload = async () => {
    if (tableData.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    tableData.forEach((row) => {
      worksheet.addRow(row);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4) Модальное окно
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // Добавление нового правила (keywords, по контрагенту) через модальное окно
  const onKeywordSaved = async (contragent, category) => {
    try {
      const newRule = await addKeyword({ contragent, category }).unwrap();
      const updatedPatterns = [...patterns, newRule];
      setPatterns(updatedPatterns);
      const userId = localStorage.getItem("userId");
      if (userId) {
        localStorage.setItem(
          `patterns_${userId}`,
          JSON.stringify(updatedPatterns)
        );
      }
      // Применяем новые правила к таблице
      const updatedTable = applyKeywordsToTable(
        tableData,
        updatedPatterns,
        assignmentKeywords || []
      );
      setTableData(updatedTable);
      if (userId) {
        localStorage.setItem(
          `tableData_${userId}`,
          JSON.stringify(updatedTable)
        );
      }
      setShowModal(false);
    } catch (err) {
      console.error("Ошибка добавления ключевого слова в базу:", err);
    }
  };

  // Кнопка "По вашим критериям": загружаем правила из keywords и assignment_keywords
  const handleApplyDefault = async () => {
    try {
      const result = await fetchKeywords().unwrap();
      const dbKeywords = result.map((kw) => ({
        contragent: kw.contragent,
        category: kw.category,
      }));
      const dbAssignmentRules = assignmentKeywords || [];
      setPatterns(dbKeywords);
      const userId = localStorage.getItem("userId");
      if (userId) {
        localStorage.setItem(`patterns_${userId}`, JSON.stringify(dbKeywords));
      }
      const updatedTable = applyKeywordsToTable(
        tableData,
        dbKeywords,
        dbAssignmentRules
      );
      setTableData(updatedTable);
      if (userId) {
        localStorage.setItem(`tableData_${userId}`, JSON.stringify(updatedTable));
      }
    } catch (err) {
      console.error("Ошибка применения ключевых слов:", err);
    }
  };

  // Функция применения правил к таблице: сначала ищем совпадение по "наименование получателя",
  // если нет – ищем по "назначение платежа"
  function applyKeywordsToTable(originalTable, dbKeywords, dbAssignmentRules) {
    if (originalTable.length === 0) return originalTable;
    const table = JSON.parse(JSON.stringify(originalTable));
    const headerRow = table[0];
    const contragentIndex = headerRow.findIndex((cell) =>
      cell.toLowerCase().includes("наименование получателя")
    );
    const assignmentIndex = headerRow.findIndex((cell) =>
      cell.toLowerCase().includes("назначение платежа")
    );
    let keywordIndex = headerRow.findIndex((cell) =>
      cell.toLowerCase().includes("ключевое слово")
    );
    if (keywordIndex === -1) {
      keywordIndex = assignmentIndex !== -1 ? assignmentIndex + 1 : headerRow.length;
      headerRow.splice(keywordIndex, 0, "Ключевое слово");
      for (let i = 1; i < table.length; i++) {
        table[i].splice(keywordIndex, 0, "");
      }
    }
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const contragentText = (row[contragentIndex] || "").toLowerCase();
      let matchedCategory = "";
      // 1) Ищем правило по контрагенту
      for (let rule of dbKeywords) {
        if (
          rule.contragent &&
          contragentText.includes(rule.contragent.toLowerCase())
        ) {
          matchedCategory = rule.category;
          break;
        }
      }
      // 2) Если правило по контрагенту не найдено и есть столбец "назначение платежа"
      if (!matchedCategory && assignmentIndex !== -1) {
        const assignmentText = (row[assignmentIndex] || "").toLowerCase();
        for (let rule of dbAssignmentRules) {
          if (
            rule.assignment &&
            assignmentText.includes(rule.assignment.toLowerCase())
          ) {
            matchedCategory = rule.category;
            break;
          }
        }
      }
      row[keywordIndex] = matchedCategory;
    }
    return table;
  }

  // ------------------- Сводные таблицы по контрагенту -------------------
  function buildContragentKeywordMap(table) {
    const map = {};
    if (table.length < 2) return map;
    const header = table[0].map((cell) => cell.toLowerCase());
    const contragentIdx = header.findIndex((c) =>
      c.includes("наименование получателя")
    );
    const keywordIdx = header.findIndex((c) => c.includes("ключевое слово"));
    if (contragentIdx === -1 || keywordIdx === -1) return map;
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const cp = row[contragentIdx]?.trim() || "";
      const kw = row[keywordIdx]?.trim() || "";
      if (cp && kw) {
        if (!map[cp]) {
          map[cp] = kw;
        }
      }
    }
    return map;
  }

  function computeSummary(table, sourceColumnIndex, groupColumnIndex, keywordMap) {
    const summaryMap = {};
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const groupKey = (row[groupColumnIndex] || "").trim() || "Не задан";
      let amountStr = row[sourceColumnIndex] || "0";
      amountStr = amountStr.replace(/\s/g, "").replace(",", ".");
      const amount = parseFloat(amountStr) || 0;
      if (amount === 0) continue;
      if (!summaryMap[groupKey]) {
        summaryMap[groupKey] = { count: 0, sum: 0 };
      }
      summaryMap[groupKey].count += 1;
      summaryMap[groupKey].sum += amount;
    }
    const result = Object.entries(summaryMap).map(([group, data]) => ({
      counterparty: group,
      count: data.count,
      sum: data.sum,
      keyword: keywordMap[group] || "",
    }));
    const totalSum = result.reduce((acc, cur) => acc + cur.sum, 0);
    return result.map((item) => ({
      ...item,
      share: totalSum ? ((item.sum / totalSum) * 100).toFixed(2) + "%" : "0%",
    }));
  }

  const handleShowSummary = () => {
    if (!tableData || tableData.length < 2) {
      alert("Нет данных для сводной таблицы по контрагенту");
      return;
    }
    const headerRow = tableData[0].map((cell) => cell.toLowerCase());
    const contragentIndex = headerRow.findIndex((c) =>
      c.includes("наименование получателя")
    );
    const debitIndex = headerRow.findIndex((c) => c.includes("дебет")); // минус (дебет)
    const creditIndex = headerRow.findIndex((c) => c.includes("кредит")); // плюс (кредит)
    if (contragentIndex === -1 || debitIndex === -1 || creditIndex === -1) {
      alert(
        'Не найдены необходимые столбцы "наименование получателя", "дебет" или "кредит"'
      );
      return;
    }
    const contragentKeywordMap = buildContragentKeywordMap(tableData);
    const summaryPos = computeSummary(
      tableData,
      creditIndex,
      contragentIndex,
      contragentKeywordMap
    );
    const summaryNeg = computeSummary(
      tableData,
      debitIndex,
      contragentIndex,
      contragentKeywordMap
    );
    setSummaryPositive(summaryPos);
    setSummaryNegative(summaryNeg);
    setShowSummary(true);
  };

  // ------------------- Сводные таблицы по назначению платежа -------------------
  function buildAssignmentKeywordMap(assignmentRules) {
    const map = {};
    if (!assignmentRules) return map;
    for (let rule of assignmentRules) {
      if (rule.assignment) {
        map[rule.assignment.toLowerCase().trim()] = rule.category;
      }
    }
    return map;
  }

  // Функция для дополнения карты назначений статьёй из таблицы (если в строках уже есть заполненное поле "Ключевое слово")
  function augmentAssignmentMapFromTable(table, map) {
    if (table.length < 2) return;
    const header = table[0].map((cell) => cell.toLowerCase());
    const assignmentIdx = header.findIndex((c) =>
      c.includes("назначение платежа")
    );
    const keywordIdx = header.findIndex((c) =>
      c.includes("ключевое слово")
    );
    if (assignmentIdx === -1 || keywordIdx === -1) return;
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const assignmentVal = (row[assignmentIdx] || "").trim().toLowerCase();
      const keywordVal = (row[keywordIdx] || "").trim();
      if (assignmentVal && keywordVal && !map[assignmentVal]) {
        map[assignmentVal] = keywordVal;
      }
    }
  }

  function computeSummaryAssignment(
    table,
    sourceColumnIndex,
    groupColumnIndex,
    assignmentKeywordMap
  ) {
    const summaryMap = {};
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const groupKey = (row[groupColumnIndex] || "").trim() || "Не задан";
      let amountStr = row[sourceColumnIndex] || "0";
      amountStr = amountStr.replace(/\s/g, "").replace(",", ".");
      const amount = parseFloat(amountStr) || 0;
      if (amount === 0) continue;
      if (!summaryMap[groupKey]) {
        summaryMap[groupKey] = { count: 0, sum: 0 };
      }
      summaryMap[groupKey].count += 1;
      summaryMap[groupKey].sum += amount;
    }
    const result = Object.entries(summaryMap).map(([group, data]) => ({
      assignment: group,
      count: data.count,
      sum: data.sum,
      keyword: assignmentKeywordMap[group.toLowerCase()] || "",
    }));
    const totalSum = result.reduce((acc, cur) => acc + cur.sum, 0);
    return result.map((item) => ({
      ...item,
      share: totalSum ? ((item.sum / totalSum) * 100).toFixed(2) + "%" : "0%",
    }));
  }

  const handleShowAssignmentSummary = () => {
    if (!tableData || tableData.length < 2) {
      alert("Нет данных для сводной таблицы по назначению платежа");
      return;
    }
    const headerRow = tableData[0].map((cell) => cell.toLowerCase());
    const assignmentIndex = headerRow.findIndex((c) => c.includes("назначение платежа"));
    const debitIndex = headerRow.findIndex((c) => c.includes("дебет"));   // минус
    const creditIndex = headerRow.findIndex((c) => c.includes("кредит")); // плюс
    if (assignmentIndex === -1 || debitIndex === -1 || creditIndex === -1) {
      alert("Не найдены необходимые столбцы для сводной таблицы по назначению платежа");
      return;
    }
    let assignmentMap = buildAssignmentKeywordMap(assignmentKeywords || []);
    // Дополнительное дополнение карты из таблицы, если в ней уже заполнен столбец "Ключевое слово"
    augmentAssignmentMapFromTable(tableData, assignmentMap);
    const summaryPos = computeSummaryAssignment(
      tableData,
      creditIndex,
      assignmentIndex,
      assignmentMap
    );
    const summaryNeg = computeSummaryAssignment(
      tableData,
      debitIndex,
      assignmentIndex,
      assignmentMap
    );
    setSummaryAssignmentPositive(summaryPos);
    setSummaryAssignmentNegative(summaryNeg);
    setShowAssignmentSummary(true);
  };
  

  return (
    <div className={styles.uploadContainer}>
      <h1>Загрузка PDF и конвертация в Excel</h1>
      <div className={styles.formGroup}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={isLoading}>
          {isLoading ? "Обработка..." : "Загрузить"}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {tableData.length > 0 && (
        <div className={styles.result}>
          <button onClick={handleDownload}>Скачать Excel</button>
          <button onClick={() => setShowModal(true)}>
            Добавить ключевое слово
          </button>
          <button onClick={handleApplyDefault}>По вашим критериям</button>
          <button onClick={handleShowSummary}>
            Показать таблицу по контрагенту
          </button>
          <button onClick={handleShowAssignmentSummary}>
            Показать таблицу по назначению платежа
          </button>
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
        <AddKeywordModal onClose={() => setShowModal(false)} onSaved={onKeywordSaved} />
      )}
      {showSummary && (
        <div className={styles.summarySection}>
          <h2>Сводная таблица по контрагенту</h2>
          <h3>Плюсовые суммы [Кредит]</h3>
          {summaryPositive.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Контрагент</th>
                  <th>Операции</th>
                  <th>Сумма</th>
                  <th>Доля</th>
                  <th>Статья</th>
                </tr>
              </thead>
              <tbody>
                {summaryPositive.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.counterparty}</td>
                    <td>{item.count}</td>
                    <td>{item.sum}</td>
                    <td>{item.share}</td>
                    <td>{item.keyword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет данных для плюсовых сумм по контрагенту</p>
          )}
          <h3>Минусовые суммы [Дебет]</h3>
          {summaryNegative.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Контрагент</th>
                  <th>Операции</th>
                  <th>Сумма</th>
                  <th>Доля</th>
                  <th>Статья</th>
                </tr>
              </thead>
              <tbody>
                {summaryNegative.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.counterparty}</td>
                    <td>{item.count}</td>
                    <td>{item.sum}</td>
                    <td>{item.share}</td>
                    <td>{item.keyword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет данных для минусовых сумм по контрагенту</p>
          )}
        </div>
      )}
      {showAssignmentSummary && (
        <div className={styles.summarySection}>
          <h2>Сводная таблица по назначению платежа</h2>
          <h3>Плюсовые суммы [Кредит]</h3>
          {summaryAssignmentPositive.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Назначение</th>
                  <th>Операции</th>
                  <th>Сумма</th>
                  <th>Доля</th>
                  <th>Статья</th>
                </tr>
              </thead>
              <tbody>
                {summaryAssignmentPositive.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.assignment}</td>
                    <td>{item.count}</td>
                    <td>{item.sum}</td>
                    <td>{item.share}</td>
                    <td>{item.keyword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет данных для плюсовых сумм по назначению платежа</p>
          )}
          <h3>Минусовые суммы [Дебет]</h3>
          {summaryAssignmentNegative.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Назначение</th>
                  <th>Операции</th>
                  <th>Сумма</th>
                  <th>Доля</th>
                  <th>Статья</th>
                </tr>
              </thead>
              <tbody>
                {summaryAssignmentNegative.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.assignment}</td>
                    <td>{item.count}</td>
                    <td>{item.sum}</td>
                    <td>{item.share}</td>
                    <td>{item.keyword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет данных для минусовых сумм по назначению платежа</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
