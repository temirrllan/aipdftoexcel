import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import styles from './AddKeywordModal.module.scss';

const AddKeywordModal = ({ onClose, onSaved }) => {
  const [contragent, setContragent] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = () => {
    if (!contragent.trim() || !category.trim()) {
      alert('Заполните оба поля: контрагент и ключевое слово');
      return;
    }
    onSaved(contragent.trim(), category.trim());
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h2 className={styles.title}>Добавить ключевое слово</h2>
        <div className={styles.field}>
          <label htmlFor="contragent" className={styles.label}>
            Наименование получателя
          </label>
          <input
            id="contragent"
            type="text"
            className={styles.input}
            value={contragent}
            onChange={e => setContragent(e.target.value)}
            placeholder="Например, ООО Ромашка"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="category" className={styles.label}>
            Ключевое слово
          </label>
          <input
            id="category"
            type="text"
            className={styles.input}
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Например, Ромашка"
          />
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddKeywordModal;