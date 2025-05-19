// routes/keywords.js
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const keywordsController = require('../controllers/keywordsController');
const authMiddleware     = require('../middlewares/authMiddleware');
const validate           = require('../middlewares/validate');

// Защищаем все маршруты
router.use(authMiddleware);

// GET /keywords/
router.get('/', keywordsController.getKeywords);

// POST /keywords/
router.post(
  '/',
  [
    body('category')
      .isString().withMessage('Поле "category" должно быть строкой')
      .trim()
      .notEmpty().withMessage('Поле "category" обязательно для заполнения'),
    body('contragent')
      .optional()
      .isString().withMessage('Поле "contragent" должно быть строкой')
      .trim(),
  ],
  validate,
  keywordsController.addKeyword
);

// PUT /keywords/:id
router.put(
  '/:id',
  [
    param('id')
      .isInt({ gt: 0 }).withMessage('ID должен быть положительным целым числом'),
    body('category')
      .isString().withMessage('Поле "category" должно быть строкой')
      .trim()
      .notEmpty().withMessage('Поле "category" обязательно для заполнения'),
    body('contragent')
      .optional()
      .isString().withMessage('Поле "contragent" должно быть строкой')
      .trim(),
  ],
  validate,
  keywordsController.updateKeyword
);

// DELETE /keywords/:id
router.delete(
  '/:id',
  [
    param('id')
      .isInt({ gt: 0 }).withMessage('ID должен быть положительным целым числом'),
  ],
  validate,
  keywordsController.deleteKeyword
);

module.exports = router;
