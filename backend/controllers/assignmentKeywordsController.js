const pool = require('../config/db');

// Получение списка assignment-ключевых слов для данного пользователя
exports.getAssignmentKeywords = async (req, res) => {
  const userId = req.user.userId; // Должен быть установлен через middleware авторизации
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

// Добавление нового assignment-ключевого слова
exports.addAssignmentKeyword = async (req, res) => {
  const userId = req.user.userId;
  const { assignment, category } = req.body;
  if (!assignment || !assignment.trim() || !category || !category.trim()) {
    return res.status(400).json({ error: 'Поля "assignment" и "category" обязательны для заполнения' });
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
    res.status(500).json({ error: error.message });
  }
};

// При необходимости можно добавить методы update и delete
