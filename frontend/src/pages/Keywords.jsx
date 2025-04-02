// src/pages/Keywords.jsx
import React, { useState } from 'react';
import {
  useGetKeywordsQuery,
  useAddKeywordMutation,
  useUpdateKeywordMutation,
  useDeleteKeywordMutation,
} from '../features/keywords/keywordsApi';
import styles from '../styles/Keywords.module.scss';

const Keywords = () => {
  const {
    data: keywords,
    isLoading,
    error,
    refetch,
  } = useGetKeywordsQuery();
  const [addKeyword] = useAddKeywordMutation();
  const [updateKeyword] = useUpdateKeywordMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  // Состояние для новой записи
  const [newKeyword, setNewKeyword] = useState({
    pattern: '',
    category_name: '',
  });
  // Состояние для редактирования
  const [editingKeywordId, setEditingKeywordId] = useState(null);
  const [editData, setEditData] = useState({ pattern: '', category_name: '' });

  const handleAdd = async () => {
    if (!newKeyword.pattern.trim() || !newKeyword.category_name.trim()) return;
    try {
      await addKeyword(newKeyword).unwrap();
      setNewKeyword({ pattern: '', category_name: '' });
      refetch();
    } catch (err) {
      console.error('Ошибка добавления:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteKeyword(id).unwrap();
      refetch();
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  const handleEdit = (kw) => {
    setEditingKeywordId(kw.id);
    setEditData({ pattern: kw.pattern, category_name: kw.category_name });
  };

  const handleUpdate = async () => {
    try {
      await updateKeyword({ id: editingKeywordId, ...editData }).unwrap();
      setEditingKeywordId(null);
      setEditData({ pattern: '', category_name: '' });
      refetch();
    } catch (err) {
      console.error('Ошибка обновления:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingKeywordId(null);
    setEditData({ pattern: '', category_name: '' });
  };

  return (
    <div className={styles.keywordsContainer}>
      <h1>Управление ключевыми словами</h1>
      {isLoading && <p>Загрузка...</p>}
      {error && <p>Ошибка при загрузке ключевых слов</p>}
      {keywords && keywords.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pattern</th>
              <th>Category</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => (
              <tr key={kw.id}>
                <td>{kw.id}</td>
                <td>
                  {editingKeywordId === kw.id ? (
                    <input
                      type="text"
                      value={editData.pattern}
                      onChange={(e) =>
                        setEditData({ ...editData, pattern: e.target.value })
                      }
                    />
                  ) : (
                    kw.pattern
                  )}
                </td>
                <td>
                  {editingKeywordId === kw.id ? (
                    <input
                      type="text"
                      value={editData.category_name}
                      onChange={(e) =>
                        setEditData({ ...editData, category_name: e.target.value })
                      }
                    />
                  ) : (
                    kw.category_name
                  )}
                </td>
                <td>
                  {editingKeywordId === kw.id ? (
                    <>
                      <button onClick={handleUpdate}>Сохранить</button>
                      <button onClick={handleCancelEdit}>Отмена</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(kw)}>Редактировать</button>
                      <button onClick={() => handleDelete(kw.id)}>Удалить</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className={styles.addForm}>
        <h2>Добавить новое правило</h2>
        <input
          type="text"
          placeholder="Введите шаблон (pattern)"
          value={newKeyword.pattern}
          onChange={(e) =>
            setNewKeyword({ ...newKeyword, pattern: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Введите категорию (category)"
          value={newKeyword.category_name}
          onChange={(e) =>
            setNewKeyword({ ...newKeyword, category_name: e.target.value })
          }
        />
        <button onClick={handleAdd}>Добавить правило</button>
      </div>
    </div>
  );
};

export default Keywords;
