// backend/controllers/aiController.js
const asyncHandler = require('express-async-handler');
const { interpretCommand } = require('../services/aiService');

exports.interpret = asyncHandler(async (req, res) => {
    console.log('=== /ai/interpret hit ===');
  console.log('Headers:', req.headers.authorization);
  console.log('Body:', req.body);
  const { message, headers } = req.body;

  if (typeof message !== 'string' || !Array.isArray(headers)) {
    return res.status(400).json({ error: 'Неправильный формат тела запроса' });
  }

  const cmd = await interpretCommand(message, headers);
  res.json(cmd);
});
