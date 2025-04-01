// src/pages/Keywords.jsx
import React, { useState } from 'react'
import {
  useGetKeywordsQuery,
  useAddKeywordMutation,
  useDeleteKeywordMutation,
} from '../features/keywords/keywordsApi'
import styles from '../styles/Keywords.module.scss'

const Keywords = () => {
  const { data: keywords, isLoading, error, refetch } = useGetKeywordsQuery()
  const [addKeyword] = useAddKeywordMutation()
  const [deleteKeyword] = useDeleteKeywordMutation()
  const [newKeyword, setNewKeyword] = useState({ pattern: '', category_name: '' })

  const handleAdd = async () => {
    if (!newKeyword.pattern.trim() || !newKeyword.category_name.trim()) return
    try {
      await addKeyword(newKeyword).unwrap()
      setNewKeyword({ pattern: '', category_name: '' })
      refetch()
    } catch (err) {
      console.error('Ошибка добавления:', err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteKeyword(id).unwrap()
      refetch()
    } catch (err) {
      console.error('Ошибка удаления:', err)
    }
  }

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
                <td>{kw.pattern}</td>
                <td>{kw.category_name}</td>
                <td>
                  <button onClick={() => handleDelete(kw.id)}>Удалить</button>
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
  )
}

export default Keywords
