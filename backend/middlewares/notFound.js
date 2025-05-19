// middlewares/notFound.js
module.exports = (req, res, next) => {
  res.status(404).json({ error: `Маршрут ${req.originalUrl} не найден` });
};
