// routes/assignmentKeywords.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/assignmentKeywordsController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/',    controller.getAssignmentKeywords);
router.post('/',   controller.addAssignmentKeyword);
router.put('/:id', controller.updateAssignmentKeyword);
router.delete('/:id', controller.deleteAssignmentKeyword);

module.exports = router;
