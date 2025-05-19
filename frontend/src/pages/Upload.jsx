// src/pages/Upload.jsx
import React, { useState, useEffect } from "react";
import styles from "../styles/Upload.module.scss";
import AddKeywordModal from "../components/AddKeywordModal";
import AddAssignmentModal from "../components/AddAssignmentModal";

const Upload = () => {
  // — базовые стейты
  const [file, setFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  // — модалки
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // — чат
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // восстановление таблички из localStorage
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    const saved = localStorage.getItem(`tableData_${uid}`);
    if (saved) setTableData(JSON.parse(saved));
  }, []);

  // простая обёртка для чата
  const addChatMsg = (msg) => setChatMessages((prev) => [...prev, msg]);

  // загрузка PDF
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

      // 1) чистим переносы и лишние пробелы
      let header = tbl[0].map((cell) =>
        typeof cell === "string" ? cell.replace(/\n/g, " ").trim() : cell
      );

      // 2) на всякий случай приведём название колонки:
      const idxDate = header.findIndex(
        (h) => typeof h === "string" && /дата операции/i.test(h)
      );
      if (idxDate !== -1) {
        header[idxDate] = "Дата операции";
      }

      // сохраняем
      const normalized = [header, ...tbl.slice(1)];
      const uid = localStorage.getItem("userId");
      if (uid)
        localStorage.setItem(`tableData_${uid}`, JSON.stringify(normalized));
      setTableData(normalized);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // отправка команды в AI
  const handleChat = async () => {
    const text = chatInput.trim();
    if (!text) return;

    addChatMsg({ from: "user", text });
    setChatInput("");

    try {
      const resp = await fetch("http://localhost:3001/ai/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: text,
          headers: tableData[0],
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const cmd = await resp.json();

      const hdr = tableData[0];
      const backup = tableData;

      // UNDO
      if (cmd.action === "undo") {
        if (history.length === 0) {
          addChatMsg({ from: "bot", text: "⚠️ Нечего отменять." });
        } else {
          const prev = history[history.length - 1];
          setHistory((h) => h.slice(0, -1));
          setTableData(prev);
          addChatMsg({ from: "bot", text: "✅ Последнее действие отменено." });
        }
        return;
      }

      // MERGE_COLUMNS (умное объединение чисел)
      // внутри handleChat, вместо предыдущего блока merge_columns:
      if (
        cmd.action === "merge_columns" &&
        Array.isArray(cmd.columns) &&
        cmd.columns.length === 2 &&
        cmd.new_name
      ) {
        // сохраняем в историю
        setHistory((h) => [...h, backup]);

        // найдём индексы колонок (например "Дебет" и "Кредит")
        const cols = cmd.columns.map((c) => c.toLowerCase());
        const idxA = hdr.findIndex((h) => h.toLowerCase().includes(cols[0])); // дебет
        const idxB = hdr.findIndex((h) => h.toLowerCase().includes(cols[1])); // кредит

        if (idxA === -1 || idxB === -1) {
          addChatMsg({
            from: "bot",
            text: "⚠️ Не нашёл указанные столбцы для объединения.",
          });
        } else {
          // порядок удаления: больший индекс первым
          const [i1, i2] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];

          // новый заголовок
          const newHeader = [...hdr];
          newHeader.splice(i2, 1);
          newHeader.splice(i1, 1, cmd.new_name);

          // парсер числа
          const parseNum = (str) => {
            if (!str) return 0;
            const norm = String(str).replace(/\s+/g, "").replace(",", ".");
            const n = parseFloat(norm);
            return isNaN(n) ? 0 : n;
          };

          // строим новую таблицу
          const updated = tableData.map((row, ri) => {
            if (ri === 0) return newHeader;
            const r = [...row];
            const debit = parseNum(row[idxA]);
            const credit = parseNum(row[idxB]);
            const turnover = debit - credit; // <— именно так!

            // удаляем оба старых столбца
            r.splice(idxB, 1);
            r.splice(idxA, 1, turnover);
            return r;
          });

          setTableData(updated);
          addChatMsg({
            from: "bot",
            text: `✅ Объединил "${hdr[idxA]}" − "${hdr[idxB]}" в "${cmd.new_name}".`,
          });
        }
        return;
      }

      // RENAME_COLUMN
      if (cmd.action === "rename_column" && typeof cmd.new_name === "string") {
        const target = (cmd.column || "").toLowerCase();
        const idx = hdr.findIndex((h) => h.toLowerCase().includes(target));
        if (idx === -1) {
          addChatMsg({
            from: "bot",
            text: "⚠️ Не нашёл столбец для переименования.",
          });
        } else {
          setHistory((h) => [...h, backup]);
          const newHeader = [...hdr];
          newHeader[idx] = cmd.new_name;
          const updated = tableData.map((row, ri) =>
            ri === 0 ? newHeader : row
          );
          setTableData(updated);
          addChatMsg({
            from: "bot",
            text: `✅ Колонка "${hdr[idx]}" переименована в "${cmd.new_name}".`,
          });
        }
        return;
      }

      // REMOVE_TIME
      if (cmd.action === "remove_time") {
        const target = (cmd.column || "").toLowerCase();
        const idx = hdr.findIndex((h) => h.toLowerCase().includes(target));
        if (idx === -1) {
          addChatMsg({
            from: "bot",
            text: "⚠️ Не нашёл столбец для удаления времени.",
          });
        } else {
          setHistory((h) => [...h, backup]);
          const updated = tableData.map((row, ri) => {
            if (ri === 0) return [...row];
            const r = [...row];
            r[idx] = String(r[idx]).replace(/\s+/g, " ").split(" ")[0];
            return r;
          });
          setTableData(updated);
          addChatMsg({
            from: "bot",
            text: `✅ В столбце "${hdr[idx]}" оставлена только дата.`,
          });
        }
        return;
      }

      // REMOVE_COLUMN
      if (cmd.action === "remove_column") {
        const target = (cmd.column || "").toLowerCase();
        const idx = hdr.findIndex((h) => h.toLowerCase().includes(target));
        if (idx === -1) {
          addChatMsg({
            from: "bot",
            text: "⚠️ Не нашёл столбец для удаления.",
          });
        } else {
          setHistory((h) => [...h, backup]);
          const updated = tableData.map((row) => {
            const r = [...row];
            r.splice(idx, 1);
            return r;
          });
          setTableData(updated);
          addChatMsg({
            from: "bot",
            text: `✅ Колонка "${hdr[idx]}" удалена.`,
          });
        }
        return;
      }

      // Нераспознанная команда
      addChatMsg({ from: "bot", text: "❓ Команда не распознана." });
    } catch (err) {
      console.error(err);
      addChatMsg({ from: "bot", text: "⚠️ Ошибка при обращении к AI." });
    }
  };

  return (
    <div className={styles.uploadContainer}>
      {/* Загрузка PDF */}
      <div className={styles.card}>
        <h1 className={styles.heading}>Загрузка PDF → Excel</h1>
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

      {/* Таблица и чат */}
      {tableData.length > 0 && (
        <div className={styles.card}>
          <div className={styles.buttonsRow}>
            {/* … ваши другие кнопки … */}
            <button onClick={() => setChatOpen((o) => !o)}>
              {chatOpen ? "Закрыть чат" : "Открыть чат"}
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
                {tableData.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chatOpen && (
            <div className={styles.chatWidget}>
              <div className={styles.chatHistory}>
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.from === "user" ? styles.chatUser : styles.chatBot
                    }
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className={styles.chatInputRow}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  placeholder="Например: убери время из столбца Дата операции"
                />
                <button onClick={handleChat}>Отправить</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Модалки */}
      {showKeywordModal && (
        <AddKeywordModal
          onClose={() => setShowKeywordModal(false)}
          onSaved={() => setShowKeywordModal(false)}
        />
      )}
      {showAssignModal && (
        <AddAssignmentModal
          onClose={() => setShowAssignModal(false)}
          onSaved={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
};

export default Upload;
