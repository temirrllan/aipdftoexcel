// controllers/keywordsController.js
const pool = require('../config/db');

exports.getKeywords = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      'SELECT id, pattern, category_name FROM keywords WHERE user_id = $1 ORDER BY id',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения ключевых слов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.addKeyword = async (req, res) => {
  const userId = req.user.userId;
  const { pattern, category_name } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO keywords (user_id, pattern, category_name)
       VALUES ($1, $2, $3)
       RETURNING id, pattern, category_name`,
      [userId, pattern, category_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.updateKeyword = async (req, res) => {
  const userId = req.user.userId;
  const keywordId = req.params.id;
  const { pattern, category_name } = req.body;
  try {
    const result = await pool.query(
      `UPDATE keywords
       SET pattern = $1, category_name = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING id, pattern, category_name`,
      [pattern, category_name, keywordId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключевое слово не найдено' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.deleteKeyword = async (req, res) => {
  const userId = req.user.userId;
  const keywordId = req.params.id;
  try {
    const result = await pool.query(
      'DELETE FROM keywords WHERE id = $1 AND user_id = $2 RETURNING id',
      [keywordId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключевое слово не найдено' });
    }
    res.json({ message: 'Ключевое слово удалено' });
  } catch (error) {
    console.error('Ошибка удаления ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
