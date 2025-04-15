// controllers/keywordsController.js
const pool = require('../config/db');

// Получение всех ключевых слов для данного пользователя
exports.getKeywords = async (req, res) => {
  const userId = req.user.userId; // Должен быть установлен через middleware авторизации
  try {
    const result = await pool.query(
      `SELECT id, user_id, contragent, category 
       FROM keywords 
       WHERE user_id = $1 
       ORDER BY id`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения ключевых слов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Добавление нового ключевого слова (правила)
exports.addKeyword = async (req, res) => {
  const userId = req.user.userId; // Из middleware авторизации
  // Принимаем поля contragent и category из тела запроса
  const { contragent, category } = req.body;
  
  // Проверка: если поле category пустое или не передано, возвращаем ошибку 400
  if (!category || category.trim() === "") {
    return res.status(400).json({ error: 'Поле "category" обязательно для заполнения' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO keywords (user_id, contragent, category)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, contragent, category`,
      [userId, contragent || '', category.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления ключевого слова:', error);
    res.status(500).json({ error: error.message });
  }
};

// Обновление ключевого слова
exports.updateKeyword = async (req, res) => {
  const userId = req.user.userId;
  const keywordId = req.params.id;
  const { contragent, category } = req.body;
  
  if (!category || category.trim() === "") {
    return res.status(400).json({ error: 'Поле "category" обязательно для заполнения' });
  }
  
  try {
    const result = await pool.query(
      `UPDATE keywords
       SET contragent = $1,
           category = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, contragent, category`,
      [contragent || '', category.trim(), keywordId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключевое слово не найдено или нет доступа' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Удаление ключевого слова
exports.deleteKeyword = async (req, res) => {
  const userId = req.user.userId;
  const keywordId = req.params.id;
  try {
    const result = await pool.query(
      `DELETE FROM keywords
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [keywordId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключевое слово не найдено или нет доступа' });
    }
    res.json({ message: 'Ключевое слово удалено' });
  } catch (error) {
    console.error('Ошибка удаления ключевого слова:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
