// backend/routes/assignmentKeywords.js
const express = require('express');
const router = express.Router();
const assignmentKeywordsController = require('../controllers/assignmentKeywordsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', assignmentKeywordsController.getAssignmentKeywords);
router.post('/', assignmentKeywordsController.addAssignmentKeyword);

module.exports = router;
