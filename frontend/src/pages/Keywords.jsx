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
  useUpdateAssignmentKeywordMutation,
  useDeleteAssignmentKeywordMutation,
} from '../features/assignmentKeywords/assignmentKeywordsApi';
import styles from '../styles/Keywords.module.scss';

const Keywords = () => {
  const userId = localStorage.getItem('userId');

  // контрагенты
  const {
    data: keywords = [],
    isLoading: isLoadingKeywords,
    error: errorKeywords,
    refetch: refetchKeywords,
  } = useGetKeywordsQuery(userId, { skip: !userId, refetchOnMountOrArgChange: true });
  const [addKeyword] = useAddKeywordMutation();
  const [updateKeyword] = useUpdateKeywordMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  // назначения
  const {
    data: assignmentKeywords = [],
    isLoading: isLoadingAssignments,
    error: errorAssignments,
    refetch: refetchAssignments,
  } = useGetAssignmentKeywordsQuery(userId, { skip: !userId, refetchOnMountOrArgChange: true });
  const [addAssignmentKeyword] = useAddAssignmentKeywordMutation();
  const [updateAssignmentKeyword] = useUpdateAssignmentKeywordMutation();
  const [deleteAssignmentKeyword] = useDeleteAssignmentKeywordMutation();

  // state для контрагентов
  const [newKeyword, setNewKeyword] = useState({ contragent: '', category: '' });
  const [editingKeywordId, setEditingKeywordId] = useState(null);
  const [editKeywordData, setEditKeywordData] = useState({ contragent: '', category: '' });

  // state для назначений
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editAssignmentData, setEditAssignmentData] = useState({ assignment: '', category: '' });

  // ---- контрагенты ----
  const handleAddKeyword = async () => {
    if (!newKeyword.contragent.trim() || !newKeyword.category.trim()) return;
    await addKeyword(newKeyword).unwrap();
    setNewKeyword({ contragent: '', category: '' });
    refetchKeywords();
  };
  const handleEditKeyword = (kw) => {
    setEditingKeywordId(kw.id);
    setEditKeywordData({ contragent: kw.contragent, category: kw.category });
  };
  const handleUpdateKeyword = async () => {
    await updateKeyword({ id: editingKeywordId, ...editKeywordData }).unwrap();
    setEditingKeywordId(null);
    refetchKeywords();
  };
  const handleDeleteKeyword = async (id) => {
    await deleteKeyword(id).unwrap();
    refetchKeywords();
  };

  // ---- назначения ----
  const handleAddAssignment = async () => {
    const assignment = prompt('Введите назначение платежа:');
    if (!assignment?.trim()) return;
    const category = prompt('Введите ключевое слово для назначения:');
    if (!category?.trim()) return;
    await addAssignmentKeyword({ assignment, category }).unwrap();
    refetchAssignments();
  };
  const handleEditAssignment = (item) => {
    setEditingAssignmentId(item.id);
    setEditAssignmentData({ assignment: item.assignment, category: item.category });
  };
  const handleUpdateAssignment = async () => {
    await updateAssignmentKeyword({ id: editingAssignmentId, ...editAssignmentData }).unwrap();
    setEditingAssignmentId(null);
    refetchAssignments();
  };
  const handleDeleteAssignment = async (id) => {
    await deleteAssignmentKeyword(id).unwrap();
    refetchAssignments();
  };

  return (
    <div className={styles.keywordsContainer}>
      <h1>Управление ключевыми словами</h1>

      {/* ========= контрагенты ========= */}
      <section className={styles.section}>
        <h2>По контрагенту</h2>
        {isLoadingKeywords && <p>Загрузка...</p>}
        {errorKeywords && <p>Ошибка загрузки</p>}
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
                      value={editKeywordData.contragent}
                      onChange={(e) => setEditKeywordData({ ...editKeywordData, contragent: e.target.value })}
                    />
                  ) : (
                    kw.contragent
                  )}
                </td>
                <td>
                  {editingKeywordId === kw.id ? (
                    <input
                      value={editKeywordData.category}
                      onChange={(e) => setEditKeywordData({ ...editKeywordData, category: e.target.value })}
                    />
                  ) : (
                    kw.category
                  )}
                </td>
                <td>
                  {editingKeywordId === kw.id ? (
                    <>
                      <button onClick={handleUpdateKeyword}>💾</button>
                      <button onClick={() => setEditingKeywordId(null)}>✖</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditKeyword(kw)}>✎</button>
                      <button onClick={() => handleDeleteKeyword(kw.id)}>🗑</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td>—</td>
              <td>
                <input
                  placeholder="Контрагент"
                  value={newKeyword.contragent}
                  onChange={(e) => setNewKeyword({ ...newKeyword, contragent: e.target.value })}
                />
              </td>
              <td>
                <input
                  placeholder="Ключевое слово"
                  value={newKeyword.category}
                  onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                />
              </td>
              <td>
                <button onClick={handleAddKeyword}>Добавить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ======== назначения ======== */}
      <section className={styles.section}>
        <h2>По назначению платежа</h2>
        {isLoadingAssignments && <p>Загрузка...</p>}
        {errorAssignments && <p>Ошибка загрузки</p>}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Назначение</th>
              <th>Ключевое слово</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {assignmentKeywords.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  {editingAssignmentId === item.id ? (
                    <input
                      value={editAssignmentData.assignment}
                      onChange={(e) =>
                        setEditAssignmentData({ ...editAssignmentData, assignment: e.target.value })
                      }
                    />
                  ) : (
                    item.assignment
                  )}
                </td>
                <td>
                  {editingAssignmentId === item.id ? (
                    <input
                      value={editAssignmentData.category}
                      onChange={(e) =>
                        setEditAssignmentData({ ...editAssignmentData, category: e.target.value })
                      }
                    />
                  ) : (
                    item.category
                  )}
                </td>
                <td>
                  {editingAssignmentId === item.id ? (
                    <>
                      <button onClick={handleUpdateAssignment}>💾</button>
                      <button onClick={() => setEditingAssignmentId(null)}>✖</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditAssignment(item)}>✎</button>
                      <button onClick={() => handleDeleteAssignment(item.id)}>🗑</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td>—</td>
              <td colSpan={2}>
                <button onClick={handleAddAssignment}>+ Добавить правило</button>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>
    </div>
);
}
export default Keywords;
