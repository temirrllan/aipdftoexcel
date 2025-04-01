// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Защищённый маршрут для получения профиля
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
