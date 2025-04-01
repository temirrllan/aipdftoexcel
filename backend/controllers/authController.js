// controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      `INSERT INTO users (username, password, email)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, hashedPassword, email]
    );

    return res.status(201).json({
      message: 'Пользователь успешно создан',
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error('Ошибка в /register:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [usernameOrEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const user = userResult.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.SECRET_KEY || 'SECRET_KEY',
      { expiresIn: '1h' }
    );

    return res.json({ message: 'Успешный вход', token });
  } catch (error) {
    console.error('Ошибка в /login:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.profile = async (req, res) => {
  try {
    // req.user устанавливается middleware и содержит, например, { userId, username }
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка в /profile:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
};
