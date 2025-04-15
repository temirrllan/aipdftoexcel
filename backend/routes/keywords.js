// routes/keywords.js
const express = require('express');
const router = express.Router();
const keywordsController = require('../controllers/keywordsController');
const authMiddleware = require('../middleware/authMiddleware');

// Делаем маршрут защищённым, если хотите,
// чтобы только авторизованные пользователи могли управлять своими ключевыми словами.
router.use(authMiddleware);

router.get('/', keywordsController.getKeywords);
router.post('/', keywordsController.addKeyword);
router.put('/:id', keywordsController.updateKeyword);
router.delete('/:id', keywordsController.deleteKeyword);

module.exports = router;
