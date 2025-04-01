// routes/keywords.js
const express = require('express');
const router = express.Router();
const keywordsController = require('../controllers/keywordsController');
const authMiddleware = require('../middleware/authMiddleware');

// Все маршруты защищены middleware для проверки токена
router.use(authMiddleware);

router.get('/', keywordsController.getKeywords);
router.post('/', keywordsController.addKeyword);
router.put('/:id', keywordsController.updateKeyword);
router.delete('/:id', keywordsController.deleteKeyword);

module.exports = router;
