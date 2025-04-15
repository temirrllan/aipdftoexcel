// src/pages/Keywords.jsx
import React, { useState } from 'react';
import {
  useGetKeywordsQuery,
  useAddKeywordMutation,
  useUpdateKeywordMutation,
  useDeleteKeywordMutation,
} from '../features/keywords/keywordsApi';
import {
  useGetAssignmentKeywordsQuery,
  useAddAssignmentKeywordMutation,
} from '../features/assignmentKeywords/assignmentKeywordsApi';
import styles from '../styles/Keywords.module.scss';

const Keywords = () => {
  // Предполагаем, что после логина идентификатор пользователя сохраняется в localStorage
  const userId = localStorage.getItem("userId");

  // Получаем ключевые слова для текущего пользователя через RTK Query.
  // Передаем userId в качестве аргумента – это поможет сбрасывать кэш при смене пользователя,
  // если в endpoint настроено refetchOnMountOrArgChange (подробнее см. документацию RTK Query).
  const {
    data: keywords,
    isLoading: isLoadingKeywords,
    error: errorKeywords,
    refetch: refetchKeywords,
  } = useGetKeywordsQuery(userId, { skip: !userId, refetchOnMountOrArgChange: true });

  // Получаем assignment-ключевые слова для текущего пользователя
  const {
    data: assignmentKeywords,
    isLoading: isLoadingAssignments,
    error: errorAssignments,
    refetch: refetchAssignments,
  } = useGetAssignmentKeywordsQuery(userId, { skip: !userId, refetchOnMountOrArgChange: true });

  // Мутации для ключевых слов (keywords)
  const [addKeyword] = useAddKeywordMutation();
  const [updateKeyword] = useUpdateKeywordMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  // Мутация для assignment-ключевых слов
  const [addAssignmentKeyword] = useAddAssignmentKeywordMutation();

  // Состояния для редактирования записи keywords
  const [editingKeywordId, setEditingKeywordId] = useState(null);
  const [editData, setEditData] = useState({ contragent: '', category: '' });

  // Состояния для нового правила keywords (контрагент-based)
  const [newKeyword, setNewKeyword] = useState({ contragent: '', category: '' });

  // Функция для добавления нового правила в таблицу keywords
  const handleAddKeyword = async () => {
    if (!newKeyword.contragent.trim() || !newKeyword.category.trim()) {
      alert('Заполните оба поля: контрагент и ключевое слово');
      return;
    }
    try {
      await addKeyword(newKeyword).unwrap();
      setNewKeyword({ contragent: '', category: '' });
      // После успешного добавления происходит рефетч всех данных keywords с сервера
      refetchKeywords();
    } catch (err) {
      console.error('Ошибка добавления ключевого слова:', err);
    }
  };

  // Функция для удаления правила
  const handleDeleteKeyword = async (id) => {
    try {
      await deleteKeyword(id).unwrap();
      refetchKeywords();
    } catch (err) {
      console.error('Ошибка удаления ключевого слова:', err);
    }
  };

  // Функция для перехода в режим редактирования
  const handleEditKeyword = (kw) => {
    setEditingKeywordId(kw.id);
    setEditData({ contragent: kw.contragent, category: kw.category });
  };

  // Функция для сохранения изменений правила
  const handleUpdateKeyword = async () => {
    if (!editData.contragent.trim() || !editData.category.trim()) {
      alert('Заполните оба поля для редактирования');
      return;
    }
    try {
      await updateKeyword({ id: editingKeywordId, ...editData }).unwrap();
      setEditingKeywordId(null);
      setEditData({ contragent: '', category: '' });
      refetchKeywords();
    } catch (err) {
      console.error('Ошибка обновления ключевого слова:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingKeywordId(null);
    setEditData({ contragent: '', category: '' });
  };

  // Функция для добавления нового правила в таблицу assignment_keywords
  // (здесь используется prompt для простоты)
  const handleAddAssignmentKeyword = async (assignment, category) => {
    if (!assignment.trim() || !category.trim()) {
      alert('Заполните оба поля: назначение платежа и ключевое слово');
      return;
    }
    try {
      await addAssignmentKeyword({ assignment, category }).unwrap();
      refetchAssignments();
    } catch (err) {
      console.error('Ошибка добавления assignment-ключевого слова:', err);
    }
  };

  return (
    <div className={styles.keywordsContainer}>
      <h1>Управление ключевыми словами</h1>

      {/* Секция 1: Ключевые слова по контрагенту */}
      <div className={styles.section}>
        <h2>Ключевые слова по контрагенту</h2>
        {isLoadingKeywords && <p>Загрузка ключевых слов...</p>}
        {errorKeywords && <p>Ошибка при загрузке ключевых слов</p>}
        {keywords && keywords.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Контрагент</th>
                <th>Ключевое слово</th>
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
                        value={editData.contragent}
                        onChange={(e) =>
                          setEditData({ ...editData, contragent: e.target.value })
                        }
                      />
                    ) : (
                      kw.contragent
                    )}
                  </td>
                  <td>
                    {editingKeywordId === kw.id ? (
                      <input
                        type="text"
                        value={editData.category}
                        onChange={(e) =>
                          setEditData({ ...editData, category: e.target.value })
                        }
                      />
                    ) : (
                      kw.category
                    )}
                  </td>
                  <td>
                    {editingKeywordId === kw.id ? (
                      <>
                        <button onClick={handleUpdateKeyword}>Сохранить</button>
                        <button onClick={handleCancelEdit}>Отмена</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditKeyword(kw)}>
                          Редактировать
                        </button>
                        <button onClick={() => handleDeleteKeyword(kw.id)}>
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className={styles.addForm}>
          <h3>Добавить правило по контрагенту</h3>
          <input
            type="text"
            placeholder="Введите контрагента"
            value={newKeyword.contragent}
            onChange={(e) =>
              setNewKeyword({ ...newKeyword, contragent: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Введите ключевое слово"
            value={newKeyword.category}
            onChange={(e) =>
              setNewKeyword({ ...newKeyword, category: e.target.value })
            }
          />
          <button onClick={handleAddKeyword}>Добавить правило</button>
        </div>
      </div>

      {/* Секция 2: Ключевые слова по назначению платежа */}
      <div className={styles.section}>
        <h2>Ключевые слова по назначению платежа</h2>
        {isLoadingAssignments && <p>Загрузка assignment-ключевых слов...</p>}
        {errorAssignments && <p>Ошибка при загрузке assignment-ключевых слов</p>}
        {assignmentKeywords && assignmentKeywords.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Назначение платежа</th>
                <th>Ключевое слово</th>
              </tr>
            </thead>
            <tbody>
              {assignmentKeywords.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.assignment}</td>
                  <td>{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Нет заданных ключевых слов для назначений платежа.</p>
        )}
        <div className={styles.addForm}>
          <h3>Добавить правило по назначению платежа</h3>
          <button
            onClick={async () => {
              const assignment = prompt("Введите назначение платежа:");
              if (!assignment || !assignment.trim()) return;
              const category = prompt("Введите ключевое слово:");
              if (!category || !category.trim()) return;
              try {
                await handleAddAssignmentKeyword(assignment.trim(), category.trim());
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Добавить правило по назначению
          </button>
        </div>
      </div>
    </div>
  );
};

export default Keywords;
