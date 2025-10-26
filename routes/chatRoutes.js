const express = require('express');
const router = express.Router();
const aiChatService = require('../services/aiChatService');
const aiChatServiceMock = require('../services/aiChatServiceMock');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Chat with AI (with fallback to mock service)
router.post('/chat', asyncHandler(async (req, res) => {
  const { userId, message, conversationHistory } = req.body;

  if (!userId || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId, message'
    });
  }

  let response;
  let usedMock = false;

  try {
    // Try OpenAI first
    response = await aiChatService.chat(userId, message, conversationHistory || []);
  } catch (error) {
    // If OpenAI fails (quota, network, etc), use mock service
    const errorMsg = error.message || '';
    const shouldUseMock = 
      errorMsg.includes('429') || 
      errorMsg.includes('quota') || 
      errorMsg.includes('exceeded') ||
      errorMsg.includes('OpenAI not configured') ||
      errorMsg.includes('status code 429') ||
      error.status === 429;
    
    if (shouldUseMock) {
      logger.warn('OpenAI unavailable, using mock service', { 
        error: errorMsg,
        userId 
      });
      response = await aiChatServiceMock.chat(userId, message);
      usedMock = true;
    } else {
      // For other errors, throw them
      throw error;
    }
  }

  res.json({
    success: true,
    data: response,
    mock: usedMock // Let client know if mock was used
  });
}));

// Index user metrics for better search
router.post('/index/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  await aiChatService.indexMetricsData(userId);

  res.json({
    success: true,
    message: 'Metrics indexed successfully'
  });
}));

// Get suggested questions
router.get('/suggestions/:userId', asyncHandler(async (req, res) => {
  const suggestions = [
    "What's my revenue trend for the last 30 days?",
    "How is my profit margin performing?",
    "What's my ROAS and is it good?",
    "How many new vs returning customers do I have?",
    "What's my average order value?",
    "Show me my best performing days",
    "How can I improve my profit margins?",
    "What's my customer retention rate?",
    "Compare this week vs last week performance",
    "What are my biggest expenses?"
  ];

  res.json({
    success: true,
    data: suggestions
  });
}));

// Clear cache for fresh data
router.post('/clear-cache/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  aiChatService.clearCache(userId);

  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
}));

// Clear all cache
router.post('/clear-cache', asyncHandler(async (req, res) => {
  aiChatService.clearCache();

  res.json({
    success: true,
    message: 'All cache cleared successfully'
  });
}));

// Get cache stats
router.get('/cache-stats', asyncHandler(async (req, res) => {
  const stats = aiChatService.getCacheStats();

  res.json({
    success: true,
    data: stats
  });
}));

module.exports = router;
