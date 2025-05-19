// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes      = require('./routes/auth');
const uploadRoutes    = require('./routes/upload');
const keywordsRoutes  = require('./routes/keywords');
const assignRoutes    = require('./routes/assignmentKeywords');
const notFound        = require('./middlewares/notFound');
const errorHandler    = require('./middlewares/errorHandler');
const aiRoutes = require('./routes/ai');
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/auth',               authRoutes);
app.use('/upload',             uploadRoutes);
app.use('/keywords',           keywordsRoutes);
app.use('/assignment_keywords', assignRoutes);
app.use('/ai', aiRoutes);

// 404 + Error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
