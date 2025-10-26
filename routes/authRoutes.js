const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');

// Signup
router.post('/signup', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ 
      success: false, 
      message: 'User already exists with this email' 
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    isActive: true
  });

  await user.save();

  res.status(201).json({ 
    success: true, 
    message: 'Signup successful! You can now login.',
    userId: user._id
  });
}));

// Google Signup
router.post('/google-signup', asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ 
      success: false, 
      message: 'User already exists with this email. Please login instead.' 
    });
  }

  // Create user without password (Google OAuth)
  const user = new User({
    firstName,
    lastName,
    email,
    isActive: true,
    googleAuth: true
  });

  await user.save();

  res.status(201).json({ 
    success: true, 
    message: 'Google signup successful! You can now login.',
    userId: user._id
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
  }

  // Check if user signed up with Google
  if (user.googleAuth && !user.password) {
    return res.status(401).json({ 
      success: false, 
      message: 'Please login with Google' 
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'profitFirst',
    { expiresIn: '7d' }
  );

  res.json({ 
    success: true, 
    message: 'Login successful',
    token,
    userId: user._id
  });
}));

// Get user by ID
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  res.json({ 
    success: true, 
    data: user,
    isAdmin: user.isAdmin || false
  });
}));

// Verify email (placeholder - implement email verification logic)
router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  // TODO: Implement email verification logic
  res.json({ 
    success: true, 
    message: 'Email verified successfully' 
  });
}));

module.exports = router;
