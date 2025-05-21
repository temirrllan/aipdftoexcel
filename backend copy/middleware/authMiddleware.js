const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Ожидаем заголовок в формате: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Нет токена' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Некорректный токен' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'SECRET_KEY');
    req.user = decoded;  // decoded содержит { userId, username, … }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
};

module.exports = authMiddleware;
