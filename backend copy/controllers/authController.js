// backend/controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Регистрация пользователя.
 * Проверяем, существует ли пользователь с таким username или email, затем создаём нового.
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // Проверяем, существует ли пользователь с таким username или email
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    // Хэширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Вставляем нового пользователя
    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'Пользователь успешно создан', user: result.rows[0] });
  } catch (error) {
    console.error('Ошибка в /register:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

/**
 * Логин пользователя.
 * Ищем пользователя по username или email, затем сравниваем переданный пароль с сохранённым хешем.
 * В случае успешного входа генерируется JWT-токен, в который включаются userId и username.
 */
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    // Ищем пользователя по username или email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [usernameOrEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    const user = userResult.rows[0];

    // Сравниваем пароли
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    // Генерация JWT-токена с payload, содержащим userId и username
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.SECRET_KEY || 'SECRET_KEY',
      { expiresIn: "1h" }
    );

    res.json({
      message: "Успешный вход",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Ошибка в /login:', error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

/**
 * Получение профиля пользователя.
 * Этот маршрут защищён (через authMiddleware) и использует req.user.userId, установленное на основании JWT-токена.
 */
exports.profile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка в /profile:', error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};
