// middlewares/validate.js
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Берём первый
    const msg = errors.array()[0].msg;
    return next(new ApiError(400, msg));
  }
  next();
};
