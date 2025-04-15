// src/components/AddKeywordModal.jsx
import React, { useState } from 'react';
import styles from './AddKeywordModal.module.scss';

const AddKeywordModal = ({ onClose, onSaved }) => {
  const [contragent, setContragent] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = () => {
    // Если хотя бы одно из полей не заполнено, можно вывести сообщение
    if (!contragent.trim() || !category.trim()) {
      alert('Заполните оба поля: контрагент и ключевое слово');
      return;
    }
    // Вызываем onSaved с введенными данными
    onSaved(contragent, category);
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>Добавить ключевое слово</h2>
        <label>
          Наименование получателя (Контрагент):
          <input
            type="text"
            value={contragent}
            onChange={(e) => setContragent(e.target.value)}
            placeholder="Например, ООО Ромашка"
          />
        </label>
        <label>
          Ключевое слово:
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Например, Ромашка"
          />
        </label>
        <div className={styles.buttons}>
          <button onClick={onClose}>Отмена</button>
          <button onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

export default AddKeywordModal;
