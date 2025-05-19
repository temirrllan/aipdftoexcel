// controllers/assignmentKeywordsController.js
const asyncHandler = require('express-async-handler');
const pool         = require('../config/db');
const ApiError     = require('../utils/ApiError');

/** Валидация текстовых полей */
function validateFields(fields, body) {
  for (const f of fields) {
    const v = body[f];
    if (!v || typeof v !== 'string' || !v.trim()) {
      throw new ApiError(400, `Поле "${f}" обязательно для заполнения`);
    }
    body[f] = v.trim();
  }
}

// GET   /assignment_keywords/
// Получить все правила пользователя
exports.getAssignmentKeywords = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { rows } = await pool.query(
    `SELECT id, user_id, assignment, category
       FROM assignment_keywords
      WHERE user_id = $1
      ORDER BY id`,
    [userId]
  );
  res.json(rows);
});

// POST  /assignment_keywords/
// Добавить правило
exports.addAssignmentKeyword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  validateFields(['assignment', 'category'], req.body);

  const { rows } = await pool.query(
    `INSERT INTO assignment_keywords (user_id, assignment, category)
         VALUES ($1, $2, $3)
     RETURNING id, user_id, assignment, category`,
    [userId, req.body.assignment, req.body.category]
  );
  res.status(201).json(rows[0]);
});

// PUT   /assignment_keywords/:id
// Обновить правило
exports.updateAssignmentKeyword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const id     = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) throw new ApiError(400, 'Неверный ID');

  validateFields(['assignment', 'category'], req.body);

  const { rows } = await pool.query(
    `UPDATE assignment_keywords
        SET assignment = $1,
            category   = $2,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
        AND user_id = $4
    RETURNING id, user_id, assignment, category`,
    [req.body.assignment, req.body.category, id, userId]
  );
  if (!rows.length) throw new ApiError(404, 'Правило не найдено или доступа нет');
  res.json(rows[0]);
});

// DELETE /assignment_keywords/:id
// Удалить правило
exports.deleteAssignmentKeyword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const id     = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) throw new ApiError(400, 'Неверный ID');

  const { rows } = await pool.query(
    `DELETE FROM assignment_keywords
      WHERE id = $1
        AND user_id = $2
    RETURNING id`,
    [id, userId]
  );
  if (!rows.length) throw new ApiError(404, 'Правило не найдено или доступа нет');
  res.json({ message: 'Удалено' });
});
