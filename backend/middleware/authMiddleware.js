// middleware/authMiddleware.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Нет токена' });
  }
  const token = authHeader.split(' ')[1]; // формат "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: 'Некорректный токен' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'SECRET_KEY');
    req.user = decoded; // добавляем payload токена в req.user
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
};

module.exports = authMiddleware;
