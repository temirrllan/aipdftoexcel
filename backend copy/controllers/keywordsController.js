// controllers/keywordsController.js
const asyncHandler = require('express-async-handler');
const pool         = require('../config/db');
const ApiError     = require('../utils/ApiError');

// Валидация входных полей
function validateFields(body, fields) {
  for (const f of fields) {
    const v = body[f];
    if (!v || typeof v !== 'string' || !v.trim()) {
      throw new ApiError(400, `Поле "${f}" обязательно для заполнения`);
    }
    body[f] = v.trim();
  }
}

// GET   /keywords/
// Получить все ключевые слова пользователя
exports.getKeywords = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { rows } = await pool.query(
    `SELECT id, user_id, contragent, category
       FROM keywords
      WHERE user_id = $1
      ORDER BY id`,
    [userId]
  );
  res.json(rows);
});

// POST  /keywords/
// Добавить новое правило
exports.addKeyword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  validateFields(req.body, ['category']);
  const contragent = (req.body.contragent || '').trim();
  const category   = req.body.category;

  const { rows } = await pool.query(
    `INSERT INTO keywords (user_id, contragent, category)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, contragent, category`,
    [userId, contragent, category]
  );
  res.status(201).json(rows[0]);
});

// PUT   /keywords/:id
// Обновить правило
exports.updateKeyword = asyncHandler(async (req, res) => {
  const userId    = req.user.userId;
  const keywordId = parseInt(req.params.id, 10);
  if (Number.isNaN(keywordId)) throw new ApiError(400, 'Некорректный ID');

  validateFields(req.body, ['category']);
  const contragent = (req.body.contragent || '').trim();
  const category   = req.body.category;

  const { rows } = await pool.query(
    `UPDATE keywords
        SET contragent  = $1,
            category    = $2,
            updated_at  = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING id, user_id, contragent, category`,
    [contragent, category, keywordId, userId]
  );
  if (!rows.length) throw new ApiError(404, 'Правило не найдено или доступа нет');
  res.json(rows[0]);
});

// DELETE /keywords/:id
// Удалить правило
exports.deleteKeyword = asyncHandler(async (req, res) => {
  const userId    = req.user.userId;
  const keywordId = parseInt(req.params.id, 10);
  if (Number.isNaN(keywordId)) throw new ApiError(400, 'Некорректный ID');

  const { rows } = await pool.query(
    `DELETE FROM keywords
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
    [keywordId, userId]
  );
  if (!rows.length) throw new ApiError(404, 'Правило не найдено или доступа нет');
  res.json({ message: 'Ключевое слово удалено' });
});
