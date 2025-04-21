// controllers/assignmentKeywordsController.js
const pool = require('../config/db');

// GET   /assignment_keywords/
// Получение списка assignment‑ключевых слов для текущего пользователя
exports.getAssignmentKeywords = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT id, user_id, assignment, category
         FROM assignment_keywords
        WHERE user_id = $1
        ORDER BY id`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения assignment-ключевых слов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// POST  /assignment_keywords/
// Добавление нового assignment‑ключевого слова
exports.addAssignmentKeyword = async (req, res) => {
  const userId = req.user.userId;
  const { assignment, category } = req.body;
  if (!assignment?.trim() || !category?.trim()) {
    return res
      .status(400)
      .json({ error: 'Поля "assignment" и "category" обязательны для заполнения' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO assignment_keywords (user_id, assignment, category)
           VALUES ($1, $2, $3)
       RETURNING id, user_id, assignment, category`,
      [userId, assignment.trim(), category.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления assignment-ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// PUT   /assignment_keywords/:id
// Обновление существующего assignment‑правила
exports.updateAssignmentKeyword = async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  const { assignment, category } = req.body;
  if (!assignment?.trim() || !category?.trim()) {
    return res
      .status(400)
      .json({ error: 'Поля "assignment" и "category" обязательны для заполнения' });
  }
  try {
    const result = await pool.query(
      `UPDATE assignment_keywords
          SET assignment = $1,
              category   = $2,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND user_id = $4
      RETURNING id, user_id, assignment, category`,
      [assignment.trim(), category.trim(), id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Не найдено или нет доступа' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления assignment-ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// DELETE /assignment_keywords/:id
// Удаление assignment‑правила
exports.deleteAssignmentKeyword = async (req, res) => {
  const userId = req.user.userId;
  const id = req.params.id;
  try {
    const result = await pool.query(
      `DELETE FROM assignment_keywords
        WHERE id = $1
          AND user_id = $2
      RETURNING id`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Не найдено или нет доступа' });
    }
    res.json({ message: 'Удалено' });
  } catch (error) {
    console.error('Ошибка удаления assignment-ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
