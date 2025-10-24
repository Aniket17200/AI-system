const express = require('express');
const router = express.Router();
const aiChatService = require('../services/aiChatService');
const { asyncHandler } = require('../middleware/errorHandler');

// Chat with AI
router.post('/chat', asyncHandler(async (req, res) => {
  const { userId, message, conversationHistory } = req.body;

  if (!userId || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId, message'
    });
  }

  const response = await aiChatService.chat(userId, message, conversationHistory || []);

  res.json({
    success: true,
    data: response
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

module.exports = router;
