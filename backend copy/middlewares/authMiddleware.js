// middlewares/authMiddleware.js
const jwt      = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new ApiError(401, 'Токен авторизации отсутствует'));
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Некорректный формат токена'));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new ApiError(500, 'JWT_SECRET не задан в .env'));
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = { userId: decoded.userId, username: decoded.username };
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Неверный или просроченный токен'));
  }
};
