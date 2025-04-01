// src/components/AddKeywordModal.jsx
import React, { useState } from 'react'
import styles from './AddKeywordModal.module.scss'

const AddKeywordModal = ({ onClose, onSaved }) => {
  const [pattern, setPattern] = useState('')
  const [category, setCategory] = useState('')

  const handleSave = () => {
    if (!pattern.trim() || !category.trim()) {
      alert('Заполните поля!')
      return
    }
    // Вызываем колбэк, передаём pattern и category
    onSaved(pattern, category)
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>Добавить ключевое слово</h2>
        <label>Паттерн (что ищем в "Назначении")</label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
        <label>Ключевое слово (категория)</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <div className={styles.buttons}>
          <button onClick={onClose}>Отмена</button>
          <button onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  )
}

export default AddKeywordModal
