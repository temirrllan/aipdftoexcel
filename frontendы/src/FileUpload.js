// FileUpload.js
import React, { useState } from 'react';

function FileUpload() {
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.elements.pdfFile.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/convert', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        // Получаем Excel-файл как Blob
        const blob = await response.blob();
        // Создаём URL для скачивания
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        console.error('Ошибка при конвертации');
      }
    } catch (err) {
      console.error('Ошибка:', err);
    }
  };

  return (
    <div>
      <h2>Загрузите PDF для конвертации</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" name="pdfFile" accept="application/pdf" />
        <button type="submit">Конвертировать</button>
      </form>
      {downloadUrl && (
        <div>
          <a href={downloadUrl} download="converted.xlsx">
            Скачать Excel
          </a>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
