// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Регистрация нового пользователя
router.post('/register', authController.register);

// Вход пользователя (логин)
router.post('/login', authController.login);

// Защищённый маршрут для получения профиля пользователя
// Middleware authMiddleware проверяет JWT-токен и устанавливает req.user
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
