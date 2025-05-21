// middlewares/errorHandler.js
const ApiError = require('../utils/ApiError');

module.exports = (err, req, res, next) => {
  console.error(err);
  if (err instanceof ApiError) {
    // Наш кастомный HTTP-ошибочник
    return res.status(err.status).json({ error: err.message });
  }
  // Всё остальное — 500
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};
