// routes/assignmentKeywords.js
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const controller = require('../controllers/assignmentKeywordsController');
const auth       = require('../middlewares/authMiddleware');
const validate   = require('../middlewares/validate');

// Все эти маршруты защищены
router.use(auth);

// GET    /assignment_keywords/
router.get('/', controller.getAssignmentKeywords);

// POST   /assignment_keywords/
router.post(
  '/',
  [
    body('assignment')
      .isString().withMessage('Поле assignment должно быть строкой')
      .trim().notEmpty().withMessage('Поле assignment обязательно'),
    body('category')
      .isString().withMessage('Поле category должно быть строкой')
      .trim().notEmpty().withMessage('Поле category обязательно'),
  ],
  validate,
  controller.addAssignmentKeyword
);

// PUT    /assignment_keywords/:id
router.put(
  '/:id',
  [
    param('id')
      .isInt({ gt: 0 }).withMessage('ID должен быть положительным числом'),
    body('assignment')
      .isString().withMessage('Поле assignment должно быть строкой')
      .trim().notEmpty().withMessage('Поле assignment обязательно'),
    body('category')
      .isString().withMessage('Поле category должно быть строкой')
      .trim().notEmpty().withMessage('Поле category обязательно'),
  ],
  validate,
  controller.updateAssignmentKeyword
);

// DELETE /assignment_keywords/:id
router.delete(
  '/:id',
  param('id')
    .isInt({ gt: 0 }).withMessage('ID должен быть положительным числом'),
  validate,
  controller.deleteAssignmentKeyword
);

module.exports = router;
