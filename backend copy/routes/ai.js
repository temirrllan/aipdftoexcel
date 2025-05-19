// backend/routes/ai.js
const express      = require('express');
const router       = express.Router();
const aiController = require('../controllers/aiController');
// const auth         = require('../middlewares/authMiddleware');

// router.use(auth);
router.post('/interpret', aiController.interpret);

module.exports = router;
