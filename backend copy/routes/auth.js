// backend/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController  = require('../controllers/authController');
const authMiddleware  = require('../middlewares/authMiddleware');
const validate        = require('../middlewares/validate');

// POST /auth/register
router.post(
  '/register',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username обязателен'),
    body('email')
      .isEmail().withMessage('Неверный формат email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
  ],
  validate,
  authController.register
);

// POST /auth/login
router.post(
  '/login',
  [
    body('usernameOrEmail')
      .trim()
      .notEmpty().withMessage('Username или Email обязателен'),
    body('password')
      .notEmpty().withMessage('Пароль обязателен'),
  ],
  validate,
  authController.login
);

// GET /auth/profile
// защищённый маршрут
router.get(
  '/profile',
  authMiddleware,
  authController.profile
);

module.exports = router;
