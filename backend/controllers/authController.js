// controllers/authController.js
const asyncHandler = require('express-async-handler');
const pool         = require('../config/db');
const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');
const ApiError     = require('../utils/ApiError');

// Общая валидация полей
function validateBody(body, fields) {
  for (const f of fields) {
    const v = body[f];
    if (!v || typeof v !== 'string' || !v.trim()) {
      throw new ApiError(400, `Поле "${f}" обязательно для заполнения`);
    }
    body[f] = v.trim();
  }
}

// POST /auth/register
exports.register = asyncHandler(async (req, res) => {
  validateBody(req.body, ['username', 'email', 'password']);
  const { username, email, password } = req.body;

  // проверяем, нет ли уже такого пользователя
  const { rows: existing } = await pool.query(
    `SELECT id FROM users WHERE username = $1 OR email = $2`,
    [username, email]
  );
  if (existing.length) {
    throw new ApiError(400, 'Пользователь с таким именем или email уже существует');
  }

  // хэшируем пароль
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  const hashed     = await bcrypt.hash(password, saltRounds);

  // создаём юзера
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
     RETURNING id, username, email`,
    [username, email, hashed]
  );

  res.status(201).json({
    message: 'Пользователь успешно создан',
    user: rows[0],
  });
});

// POST /auth/login
exports.login = asyncHandler(async (req, res) => {
  validateBody(req.body, ['usernameOrEmail', 'password']);
  const { usernameOrEmail, password } = req.body;

  // ищем пользователя
  const { rows } = await pool.query(
    `SELECT id, username, email, password
       FROM users
      WHERE username = $1 OR email = $1`,
    [usernameOrEmail]
  );
  if (!rows.length) {
    throw new ApiError(401, 'Неверные учетные данные');
  }
  const user = rows[0];

  // проверяем пароль
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Неверные учетные данные');
  }

  // создаём JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET не задан в .env');
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    secret,
    { expiresIn: '1h' }
  );

  res.json({
    message: 'Успешный вход',
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

// GET /auth/profile
exports.profile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { rows } = await pool.query(
    `SELECT id, username, email
       FROM users
      WHERE id = $1`,
    [userId]
  );
  if (!rows.length) {
    throw new ApiError(404, 'Пользователь не найден');
  }
  res.json(rows[0]);
});
