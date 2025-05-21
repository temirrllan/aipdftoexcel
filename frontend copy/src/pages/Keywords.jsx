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
  useUpdateAssignmentKeywordMutation,
  useDeleteAssignmentKeywordMutation,
} from '../features/assignmentKeywords/assignmentKeywordsApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Keywords.module.scss';

const Keywords = () => {
  const userId = localStorage.getItem('userId');

  // Контрагенты
  const { data: keywords = [], isLoading: isLoadingKw, error: errorKw } =
    useGetKeywordsQuery(userId, { skip: !userId, refetchOnMountOrArgChange: true });
  const [addKeyword, { isLoading: addingKw }] = useAddKeywordMutation();
  const [updateKeyword, { isLoading: updatingKw }] = useUpdateKeywordMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  // Назначения
  const {
    data: assignmentKeywords = [],
    isLoading: isLoadingAsn,
    error: errorAsn,
  } = useGetAssignmentKeywordsQuery(userId, {
    skip: !userId,
    refetchOnMountOrArgChange: true,
  });
  const [addAssignment, { isLoading: addingAsn }] = useAddAssignmentKeywordMutation();
  const [updateAssignment, { isLoading: updatingAsn }] =
    useUpdateAssignmentKeywordMutation();
  const [deleteAssignment] = useDeleteAssignmentKeywordMutation();

  // State контрагентов
  const [newKw, setNewKw] = useState({ contragent: '', category: '' });
  const [editKwId, setEditKwId] = useState(null);
  const [editKw, setEditKw] = useState({ contragent: '', category: '' });

  // State назначений
  const [newAsn, setNewAsn] = useState({ assignment: '', category: '' });
  const [editAsnId, setEditAsnId] = useState(null);
  const [editAsn, setEditAsn] = useState({ assignment: '', category: '' });

  const handleAddKeyword = async () => {
    if (!newKw.contragent || !newKw.category) return;
    await addKeyword(newKw).unwrap();
    setNewKw({ contragent: '', category: '' });
  };
  const handleSaveKeyword = async () => {
    await updateKeyword({ id: editKwId, ...editKw }).unwrap();
    setEditKwId(null);
  };
  const handleDelKeyword = async (id) => {
    if (window.confirm('Удалить контрагента?')) await deleteKeyword(id).unwrap();
  };

  const handleAddAssignment = async () => {
    if (!newAsn.assignment || !newAsn.category) return;
    await addAssignment(newAsn).unwrap();
    setNewAsn({ assignment: '', category: '' });
  };
  const handleSaveAsn = async () => {
    await updateAssignment({ id: editAsnId, ...editAsn }).unwrap();
    setEditAsnId(null);
  };
  const handleDelAsn = async (id) => {
    if (window.confirm('Удалить назначение?')) await deleteAssignment(id).unwrap();
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Управление ключевыми словами</h1>

      <div className={styles.cards}>
        {/* Карточка: Контрагенты */}
        <section className={styles.card}>
          <h2>По контрагенту</h2>
          {isLoadingKw && <p className={styles.note}>Загрузка…</p>}
          {errorKw && <p className={styles.error}>Ошибка загрузки</p>}

          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Контрагент</th>
                <th>Ключевое слово</th>
                <th>⏵</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.id}>
                  <td>{kw.id}</td>
                  <td>
                    {editKwId === kw.id ? (
                      <input
                        className={styles.input}
                        value={editKw.contragent}
                        onChange={(e) =>
                          setEditKw({ ...editKw, contragent: e.target.value })
                        }
                      />
                    ) : (
                      kw.contragent
                    )}
                  </td>
                  <td>
                    {editKwId === kw.id ? (
                      <input
                        className={styles.input}
                        value={editKw.category}
                        onChange={(e) =>
                          setEditKw({ ...editKw, category: e.target.value })
                        }
                      />
                    ) : (
                      kw.category
                    )}
                  </td>
                  <td className={styles.actions}>
                    {editKwId === kw.id ? (
                      <>
                        <button onClick={handleSaveKeyword} disabled={updatingKw}>
                          <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button onClick={() => setEditKwId(null)}>
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditKwId(kw.id);
                            setEditKw({ contragent: kw.contragent, category: kw.category });
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => handleDelKeyword(kw.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {/* Форма добавления */}
              <tr className={styles.newRow}>
                <td>—</td>
                <td>
                  <input
                    className={styles.input}
                    placeholder="Контрагент"
                    value={newKw.contragent}
                    onChange={(e) =>
                      setNewKw({ ...newKw, contragent: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className={styles.input}
                    placeholder="Ключевое слово"
                    value={newKw.category}
                    onChange={(e) =>
                      setNewKw({ ...newKw, category: e.target.value })
                    }
                  />
                </td>
                <td className={styles.actions}>
                  <button onClick={handleAddKeyword} disabled={addingKw}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Карточка: Назначения */}
        <section className={styles.card}>
          <h2>По назначению</h2>
          {isLoadingAsn && <p className={styles.note}>Загрузка…</p>}
          {errorAsn && <p className={styles.error}>Ошибка загрузки</p>}

          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Назначение</th>
                <th>Ключевое слово</th>
                <th>⏵</th>
              </tr>
            </thead>
            <tbody>
              {assignmentKeywords.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    {editAsnId === item.id ? (
                      <input
                        className={styles.input}
                        value={editAsn.assignment}
                        onChange={(e) =>
                          setEditAsn({ ...editAsn, assignment: e.target.value })
                        }
                      />
                    ) : (
                      item.assignment
                    )}
                  </td>
                  <td>
                    {editAsnId === item.id ? (
                      <input
                        className={styles.input}
                        value={editAsn.category}
                        onChange={(e) =>
                          setEditAsn({ ...editAsn, category: e.target.value })
                        }
                      />
                    ) : (
                      item.category
                    )}
                  </td>
                  <td className={styles.actions}>
                    {editAsnId === item.id ? (
                      <>
                        <button onClick={handleSaveAsn} disabled={updatingAsn}>
                          <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button onClick={() => setEditAsnId(null)}>
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditAsnId(item.id);
                            setEditAsn({
                              assignment: item.assignment,
                              category: item.category,
                            });
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => handleDelAsn(item.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {/* Форма добавления */}
              <tr className={styles.newRow}>
                <td>—</td>
                <td>
                  <input
                    className={styles.input}
                    placeholder="Назначение"
                    value={newAsn.assignment}
                    onChange={(e) =>
                      setNewAsn({ ...newAsn, assignment: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className={styles.input}
                    placeholder="Ключевое слово"
                    value={newAsn.category}
                    onChange={(e) =>
                      setNewAsn({ ...newAsn, category: e.target.value })
                    }
                  />
                </td>
                <td className={styles.actions}>
                  <button onClick={handleAddAssignment} disabled={addingAsn}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Keywords;
