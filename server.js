require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');
const syncScheduler = require('./services/syncScheduler');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'ProfitFirst API - Production Ready',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      users: 'POST /api/users, GET /api/users, GET /api/users/:id, PUT /api/users/:id',
      productCosts: 'POST /api/product-costs, GET /api/product-costs/:userId, DELETE /api/product-costs/:id',
      sync: 'POST /api/sync/manual, GET /api/sync/jobs/:userId, GET /api/sync/status/:jobId',
      metrics: 'GET /api/metrics, GET /api/metrics/summary/:userId'
    }
  });
});

app.use('/api', routes);
app.use('/api/ai', require('./routes/chatRoutes'));

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
  
  // Start automatic sync scheduler
  syncScheduler.startAutoSync();
});
