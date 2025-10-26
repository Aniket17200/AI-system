const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// Get current onboarding step
router.get('/step', asyncHandler(async (req, res) => {
  const userId = req.headers['user-id'] || req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID required' 
    });
  }

  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  // Determine step based on what's completed
  let step = 1;
  
  if (user.shopifyStore && user.shopifyAccessToken) {
    step = 6; // Completed - redirect to dashboard
  } else if (user.shiprocketEmail) {
    step = 5;
  } else if (user.metaAdAccountId) {
    step = 4;
  } else if (user.shopifyStore) {
    step = 3;
  } else {
    step = 1;
  }

  res.json({ 
    success: true, 
    step 
  });
}));

// Step 1: Basic info
router.post('/step1', asyncHandler(async (req, res) => {
  const userId = req.headers['user-id'] || req.body.userId;
  const { firstName, lastName, email } = req.body;

  await User.findByIdAndUpdate(userId, {
    firstName,
    lastName,
    email
  });

  res.json({ 
    success: true, 
    message: 'Step 1 completed' 
  });
}));

// Step 2: Shopify connection
router.post('/step2', asyncHandler(async (req, res) => {
  const userId = req.headers['user-id'] || req.body.userId;
  const { storeUrl, accessToken } = req.body;

  await User.findByIdAndUpdate(userId, {
    shopifyStore: storeUrl,
    shopifyAccessToken: accessToken
  });

  res.json({ 
    success: true, 
    message: 'Shopify connected' 
  });
}));

// Get Shopify products
router.get('/fetchproduct', asyncHandler(async (req, res) => {
  // TODO: Implement Shopify product fetching
  res.json({ 
    success: true, 
    products: [] 
  });
}));

// Update product costs
router.post('/modifyprice', asyncHandler(async (req, res) => {
  // TODO: Implement product cost updates
  res.json({ 
    success: true, 
    message: 'Product costs updated' 
  });
}));

// Step 4: Meta Ads
router.get('/ad-accounts', asyncHandler(async (req, res) => {
  // TODO: Implement Meta ad accounts fetching
  res.json({ 
    success: true, 
    accounts: [] 
  });
}));

router.post('/step4', asyncHandler(async (req, res) => {
  const userId = req.headers['user-id'] || req.body.userId;
  const { adAccountId, accessToken } = req.body;

  await User.findByIdAndUpdate(userId, {
    metaAdAccountId: adAccountId,
    metaAccessToken: accessToken
  });

  res.json({ 
    success: true, 
    message: 'Meta Ads connected' 
  });
}));

router.get('/login', asyncHandler(async (req, res) => {
  // TODO: Implement Meta OAuth login
  res.json({ 
    success: true, 
    loginUrl: 'https://facebook.com/oauth' 
  });
}));

// Step 5: Shiprocket
router.post('/step5', asyncHandler(async (req, res) => {
  const userId = req.headers['user-id'] || req.body.userId;
  const { email, password } = req.body;

  await User.findByIdAndUpdate(userId, {
    shiprocketEmail: email,
    shiprocketPassword: password
  });

  res.json({ 
    success: true, 
    message: 'Shiprocket connected' 
  });
}));

// Proxy token endpoint
router.get('/proxy/token', asyncHandler(async (req, res) => {
  // TODO: Implement Shopify OAuth proxy
  res.json({ 
    success: true, 
    accessToken: 'dummy_token' 
  });
}));

module.exports = router;
