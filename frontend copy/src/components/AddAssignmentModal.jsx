// src/components/AddAssignmentModal.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import styles from "./AddAssignmentModal.module.scss";

const AddAssignmentModal = ({ onClose, onSaved }) => {
  const [assignment, setAssignment] = useState("");
  const [category, setCategory] = useState("");

  const handleSave = () => {
    if (!assignment.trim() || !category.trim()) {
      alert("Заполните оба поля");
      return;
    }
    onSaved(assignment.trim(), category.trim());
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h2 className={styles.title}>Новое правило по назначению</h2>
        <label className={styles.label}>
          Назначение платежа
          <input
            className={styles.input}
            type="text"
            value={assignment}
            onChange={e => setAssignment(e.target.value)}
            placeholder="Например, Парковка"
          />
        </label>
        <label className={styles.label}>
          Ключевое слово
          <input
            className={styles.input}
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Например, парковка"
          />
        </label>
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>Отмена</button>
          <button className={styles.save} onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

export default AddAssignmentModal;
