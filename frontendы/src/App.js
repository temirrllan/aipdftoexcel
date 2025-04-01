// client/src/App.js
import React, { useState } from 'react';

function App() {
  const [tableData, setTableData] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdfFile', file);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setTableData(data.tableData);
        setExcelFile(data.excelFile);
      } else {
        setError(data.error || 'Неизвестная ошибка');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка сети или сервера');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!excelFile) return;
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${excelFile}`;
    link.download = 'output.xlsx';
    link.click();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Конвертер PDF в Excel (Camelot)</h1>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      {loading && <p>Обработка файла...</p>}
      {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}

      {tableData.length > 0 && (
        <div>
          <button onClick={downloadExcel} style={{ margin: '20px 0' }}>
            Скачать Excel
          </button>
          <h2>Результат (таблица):</h2>
          <table border="1" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ padding: '5px' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
