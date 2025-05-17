// src/pages/Upload.jsx
import React, { useState, useEffect } from "react";
import styles from "../styles/Upload.module.scss";
import AddKeywordModal from "../components/AddKeywordModal";
import ExcelJS from "exceljs";

import {
  useLazyGetKeywordsQuery,
  useAddKeywordMutation,
} from "../features/keywords/keywordsApi";
import {
  useGetAssignmentKeywordsQuery,
  useAddAssignmentKeywordMutation,
} from "../features/assignmentKeywords/assignmentKeywordsApi";
import AddAssignmentModal from "../components/AddAssignmentModal";

const Upload = () => {
  // ——————————————————————————
  // состояния
  // ——————————————————————————
  const [file, setFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showAssignmentSummary, setShowAssignmentSummary] = useState(false);
  const [summaryPositive, setSummaryPositive] = useState([]);
  const [summaryNegative, setSummaryNegative] = useState([]);
  const [summaryAssignmentPositive, setSummaryAssignmentPositive] = useState([]);
  const [summaryAssignmentNegative, setSummaryAssignmentNegative] = useState([]);
 // + для открытия Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  // + временные state для нового правила
  const [newAssignment, setNewAssignment] = useState({ assignment: "", category: "" });
  // RTK Query hooks
  const [fetchKeywords] = useLazyGetKeywordsQuery();
  const [addKeyword] = useAddKeywordMutation();

  const {
    data: assignmentKeywords = [],
    refetch: refetchAssignmentKeywords,
  } = useGetAssignmentKeywordsQuery(undefined, { refetchOnFocus: true });
  const [addAssignmentKeyword] = useAddAssignmentKeywordMutation();

  // восстановление из localStorage
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    const td = localStorage.getItem(`tableData_${uid}`);
    const pt = localStorage.getItem(`patterns_${uid}`);
    if (td) setTableData(JSON.parse(td));
    if (pt) setPatterns(JSON.parse(pt));
  }, []);

  // ——————————————————————————
  // загрузка PDF и CSV → таблица
  // ——————————————————————————
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("pdfFile", file);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const { tableData: tbl } = await res.json();
      const uid = localStorage.getItem("userId");
      if (uid) localStorage.setItem(`tableData_${uid}`, JSON.stringify(tbl));
      setTableData(tbl);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ——————————————————————————
  // экспорт в Excel с листами–сводками
  // ——————————————————————————
  const handleExportWithSummaries = async () => {
    const wb = new ExcelJS.Workbook();

    // Raw data sheet
    const wsRaw = wb.addWorksheet("Исходные данные");
    tableData.forEach((row) => wsRaw.addRow(row));

    // Helper
    function addSummarySheet(name, arr, columns) {
      const ws = wb.addWorksheet(name);
      ws.addRow(columns.map((c) => c.header));
      arr.forEach((item) => {
        ws.addRow(columns.map((c) => item[c.key]));
      });
    }

    // 2) Contractor Credit
    addSummarySheet("По контрагенту +", summaryPositive, [
      { key: "group", header: "Контрагент" },
      { key: "count", header: "Операции" },
      { key: "sum", header: "Сумма" },
      { key: "share", header: "Доля" },
      { key: "keyword", header: "Статья" },
    ]);

    // 3) Contractor Debit
    addSummarySheet("По контрагенту –", summaryNegative, [
      { key: "group", header: "Контрагент" },
      { key: "count", header: "Операции" },
      { key: "sum", header: "Сумма" },
      { key: "share", header: "Доля" },
      { key: "keyword", header: "Статья" },
    ]);

    // 4) Assignment Credit
    addSummarySheet("По назначению +", summaryAssignmentPositive, [
      { key: "assignment", header: "Назначение" },
      { key: "count", header: "Операции" },
      { key: "sum", header: "Сумма" },
      { key: "share", header: "Доля" },
      { key: "keyword", header: "Статья" },
    ]);

    // 5) Assignment Debit
    addSummarySheet("По назначению –", summaryAssignmentNegative, [
      { key: "assignment", header: "Назначение" },
      { key: "count", header: "Операции" },
      { key: "sum", header: "Сумма" },
      { key: "share", header: "Доля" },
      { key: "keyword", header: "Статья" },
    ]);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ——————————————————————————
  // расчёт сводок по контрагенту
  // ——————————————————————————
  function calcSummary(table, amountIdx, groupIdx, keywordMap) {
    const map = {};
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const group = (row[groupIdx] || "").trim();
      const raw = (row[amountIdx] || "0")
        .toString()
        .replace(/\s/g, "")
        .replace(",", ".");
      const val = parseFloat(raw) || 0;
      if (!group || val === 0) continue;
      map[group] = map[group] || { count: 0, sum: 0 };
      map[group].count++;
      map[group].sum += val;
    }
    const total = Object.values(map).reduce((s, x) => s + x.sum, 0) || 1;
    return Object.entries(map).map(([group, data]) => ({
      group,
      count: data.count,
      sum: data.sum,
      share: ((data.sum / total) * 100).toFixed(2) + "%",
      keyword: keywordMap[group] || "",
    }));
  }

  // ——————————————————————————
  // расчёт сводок по назначению
  // ——————————————————————————
  function calcAssignmentSummary(table, amountIdx, groupIdx, assignmentMap) {
    const map = {};
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const asn = (row[groupIdx] || "").trim();
      const raw = (row[amountIdx] || "0")
        .toString()
        .replace(/\s/g, "")
        .replace(",", ".");
      const val = parseFloat(raw) || 0;
      if (!asn || val === 0) continue;
      map[asn] = map[asn] || { count: 0, sum: 0 };
      map[asn].count++;
      map[asn].sum += val;
    }
    const total = Object.values(map).reduce((s, x) => s + x.sum, 0) || 1;
    return Object.entries(map).map(([asn, data]) => ({
      assignment: asn,
      count: data.count,
      sum: data.sum,
      share: ((data.sum / total) * 100).toFixed(2) + "%",
      keyword: assignmentMap[asn.toLowerCase()] || "",
    }));
  }

  // ——————————————————————————
  // модальное окно — сохранение нового правила
  // ——————————————————————————
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  const onKeywordSaved = async (contragent, category) => {
    try {
      const rule = await addKeyword({ contragent, category }).unwrap();
      const upd = [...patterns, rule];
      setPatterns(upd);
      const uid = localStorage.getItem("userId");
      if (uid) localStorage.setItem(`patterns_${uid}`, JSON.stringify(upd));

      // сразу применяем к таблице
      const filled = applyPatterns(tableData, upd, assignmentKeywords);
      setTableData(filled);
      if (uid) localStorage.setItem(`tableData_${uid}`, JSON.stringify(filled));
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  // ——————————————————————————
  // добавить правило по назначению
  // ——————————————————————————
 const handleAddAssignmentRule = () => {
   // просто открываем модал
   setShowAssignModal(true);
 };
const onAssignmentSaved = async (assignment, category) => {
   await addAssignmentKeyword({ assignment, category }).unwrap();
   await refetchAssignmentKeywords();
   // сразу перекрашиваем таблицу:
   const filled = applyPatterns(tableData, patterns, assignmentKeywords.concat({ assignment, category }));
   setTableData(filled);
   const uid = localStorage.getItem("userId");
   if (uid) localStorage.setItem(`tableData_${uid}`, JSON.stringify(filled));
   setShowAssignModal(false);
 };
  // ——————————————————————————
  // по вашим критериям (читать из БД и применять)
  // ——————————————————————————
  const handleApplyDefault = async () => {
    try {
      const db = await fetchKeywords().unwrap();
      const kw = db.map((x) => ({ contragent: x.contragent, category: x.category }));
      setPatterns(kw);
      const uid = localStorage.getItem("userId");
      if (uid) localStorage.setItem(`patterns_${uid}`, JSON.stringify(kw));

      await refetchAssignmentKeywords();
      const filled = applyPatterns(tableData, kw, assignmentKeywords);
      setTableData(filled);
      if (uid) localStorage.setItem(`tableData_${uid}`, JSON.stringify(filled));
    } catch (e) {
      console.error(e);
    }
  };

  // ——————————————————————————
  // applyPatterns — проставить “ключевое слово” в таблице
  // ——————————————————————————
  function applyPatterns(orig, kwPatterns, asnPatterns) {
    if (!orig.length) return orig;
    const table = JSON.parse(JSON.stringify(orig));
    const hdr = table[0].map((c) => c.toLowerCase());
    const ci = hdr.findIndex((c) => c.includes("наименование получателя"));
    const ai = hdr.findIndex((c) => c.includes("назначение платежа"));
    let ki = hdr.findIndex((c) => c.includes("ключевое слово"));
    if (ki < 0) {
      ki = ai >= 0 ? ai + 1 : table[0].length;
      table[0].splice(ki, 0, "Ключевое слово");
      for (let i = 1; i < table.length; i++) table[i].splice(ki, 0, "");
    }
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      let cat = "";
      const ct = (row[ci] || "").toLowerCase();
      for (const p of kwPatterns) {
        if (p.contragent && ct.includes(p.contragent.toLowerCase())) {
          cat = p.category;
          break;
        }
      }
      if (!cat && ai >= 0) {
        const at = (row[ai] || "").toLowerCase();
        for (const p of asnPatterns) {
          if (p.assignment && at.includes(p.assignment.toLowerCase())) {
            cat = p.category;
            break;
          }
        }
      }
      row[ki] = cat;
    }
    return table;
  }

  // ——————————————————————————
  // показать сводную по контрагенту
  // ——————————————————————————
  const handleShowSummary = () => {
    if (tableData.length < 2) {
      alert("Нет данных");
      return;
    }
    const hdr = tableData[0].map((c) => c.toLowerCase());
    const ci = hdr.findIndex((c) => c.includes("наименование получателя"));
    const di = hdr.findIndex((c) => c.includes("дебет"));
    const cr = hdr.findIndex((c) => c.includes("кредит"));
    if (ci < 0 || di < 0 || cr < 0) {
      alert("Не найдены столбцы");
      return;
    }
    const ki = hdr.findIndex((c) => c.includes("ключевое слово"));
    const map = {};
    tableData.slice(1).forEach((r) => {
      const name = (r[ci] || "").trim();
      const kw = (r[ki] || "").trim();
      if (name && kw && !map[name]) map[name] = kw;
    });
    setSummaryPositive(calcSummary(tableData, cr, ci, map));
    setSummaryNegative(calcSummary(tableData, di, ci, map));
    setShowSummary(true);
  };

  // ——————————————————————————
  // показать сводную по назначению
  // ——————————————————————————
  const handleShowAssignmentSummary = async () => {
    if (tableData.length < 2) {
      alert("Нет данных");
      return;
    }
    await refetchAssignmentKeywords();
    const hdr = tableData[0].map((c) => c.toLowerCase());
    const ai = hdr.findIndex((c) => c.includes("назначение платежа"));
    const di = hdr.findIndex((c) => c.includes("дебет"));
    const cr = hdr.findIndex((c) => c.includes("кредит"));
    if (ai < 0 || di < 0 || cr < 0) {
      alert("Не найдены столбцы");
      return;
    }
    const am = {};
    assignmentKeywords.forEach(({ assignment, category }) => {
      if (assignment) am[assignment.toLowerCase().trim()] = category;
    });
    const ki = hdr.findIndex((c) => c.includes("ключевое слово"));
    tableData.slice(1).forEach((r) => {
      const asn = (r[ai] || "").trim().toLowerCase();
      const kw = (r[ki] || "").trim();
      if (asn && kw && !am[asn]) am[asn] = kw;
    });
    setSummaryAssignmentPositive(
      calcAssignmentSummary(tableData, cr, ai, am)
    );
    setSummaryAssignmentNegative(
      calcAssignmentSummary(tableData, di, ai, am)
    );
    setShowAssignmentSummary(true);
  };

  // ——————————————————————————
  // рендер
  // ——————————————————————————
  return (
    <div className={styles.uploadContainer}>
      {/* Загрузка PDF → Excel */}
      <div className={styles.card}>
        <h1 className={styles.heading}>Загрузка PDF → Excel</h1>
     <div className={styles.formGroup}></div> 

<div className={styles.formGroup}>
  <label className={styles.fileInput}>
    <input type="file" accept=".pdf" onChange={handleFileChange} />
    <span>Выберите файл</span>
  </label>
  {file && <span className={styles.fileName}>{file.name}</span>}
  <button onClick={handleUpload} disabled={isLoading}>
    {isLoading ? "Обработка..." : "Загрузить"}
  </button>
</div>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      {/* Кнопки и основная таблица */}
      {tableData.length > 0 && (
        <div className={styles.card}>
          <div className={styles.buttonsRow}>
            <button onClick={handleExportWithSummaries}>
              Скачать Excel
            </button>
            <button onClick={openModal}>Добавить правило по контрагенту</button>
            <button onClick={handleAddAssignmentRule}>
              Добавить правило по назначению
            </button>
            <button onClick={handleApplyDefault}>По вашим критериям</button>
            <button onClick={handleShowSummary}>
              Сводная по контрагенту
            </button>
            <button onClick={handleShowAssignmentSummary}>
              Сводная по назначению
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {tableData[0].map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(1).map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
{showAssignModal && (
       <AddAssignmentModal
         onClose={() => setShowAssignModal(false)}
         onSaved={onAssignmentSaved}
       />
     )}
      {/* Модалка для добавления правила */}
      {showModal && (
        <AddKeywordModal
          onClose={closeModal}
          onSaved={onKeywordSaved}
        />
      )}

      {/* Сводные */}
      {showSummary && (
        <div className={styles.card}>
          <h2 className={styles.subheading}>Сводная по контрагенту</h2>
          <h3>Плюсовые (Кредит)</h3>
          <SummaryTable data={summaryPositive} />
          <h3>Минусовые (Дебет)</h3>
          <SummaryTable data={summaryNegative} />
        </div>
      )}
      {showAssignmentSummary && (
        <div className={styles.card}>
          <h2 className={styles.subheading}>
            Сводная по назначению платежа
          </h2>
          <h3>Плюсовые (Кредит)</h3>
          <AssignmentSummaryTable data={summaryAssignmentPositive} />
          <h3>Минусовые (Дебет)</h3>
          <AssignmentSummaryTable data={summaryAssignmentNegative} />
        </div>
      )}
    </div>
  );
};

// Вспомогательные компоненты для вывода сводок
const SummaryTable = ({ data }) => (
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
      {data.map((row, i) => (
        <tr key={i}>
          <td>{row.group}</td>
          <td>{row.count}</td>
          <td>{row.sum}</td>
          <td>{row.share}</td>
          <td>{row.keyword}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const AssignmentSummaryTable = ({ data }) => (
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
      {data.map((row, i) => (
        <tr key={i}>
          <td>{row.assignment}</td>
          <td>{row.count}</td>
          <td>{row.sum}</td>
          <td>{row.share}</td>
          <td>{row.keyword}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default Upload;
