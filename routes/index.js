const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProductCost = require('../models/ProductCost');
const SyncJob = require('../models/SyncJob');
const DailyMetrics = require('../models/DailyMetrics');
const syncScheduler = require('../services/syncScheduler');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateUser, validateProductCost, validateDateRange } = require('../middleware/validation');

// User routes
router.post('/users', validateUser, asyncHandler(async (req, res) => {
  const user = new User(req.body);
  await user.save();
  
  // Optionally trigger 3-month sync for new user
  if (req.body.sync3Months) {
    // Don't wait for sync to complete, run in background
    syncScheduler.sync3MonthsForNewUser(user._id).catch(err => {
      console.error('Background 3-month sync failed:', err);
    });
  }
  
  res.json({ success: true, data: user });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-shopifyAccessToken -metaAccessToken -shiprocketPassword');
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, data: user });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, data: user });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find().select('-shopifyAccessToken -metaAccessToken -shiprocketPassword');
  res.json({ success: true, data: users });
}));

// Product cost routes
router.post('/product-costs', validateProductCost, asyncHandler(async (req, res) => {
  const { userId, shopifyProductId, productName, cost } = req.body;
  const productCost = await ProductCost.findOneAndUpdate(
    { userId, shopifyProductId },
    { productName, cost, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: productCost });
}));

router.get('/product-costs/:userId', asyncHandler(async (req, res) => {
  const costs = await ProductCost.find({ userId: req.params.userId });
  res.json({ success: true, data: costs, count: costs.length });
}));

router.delete('/product-costs/:id', asyncHandler(async (req, res) => {
  await ProductCost.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Product cost deleted' });
}));

// Sync routes
router.post('/sync/manual', validateDateRange, asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.body;
  const result = await syncScheduler.manualSync(userId, new Date(startDate), new Date(endDate));
  res.json({ success: true, data: result });
}));

router.get('/sync/jobs/:userId', asyncHandler(async (req, res) => {
  const jobs = await SyncJob.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, data: jobs });
}));

router.get('/sync/status/:jobId', asyncHandler(async (req, res) => {
  const job = await SyncJob.findOne({ jobId: req.params.jobId });
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, data: job });
}));

// Metrics routes
router.get('/metrics', asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.query;
  
  if (!userId || !startDate || !endDate) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: userId, startDate, endDate' 
    });
  }
  
  const metrics = await DailyMetrics.find({
    userId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).sort({ date: 1 });

  // Calculate totals
  const totals = metrics.reduce((acc, m) => ({
    totalOrders: acc.totalOrders + m.totalOrders,
    revenue: acc.revenue + m.revenue,
    cogs: acc.cogs + m.cogs,
    adSpend: acc.adSpend + m.adSpend,
    shippingCost: acc.shippingCost + m.shippingCost,
    grossProfit: acc.grossProfit + m.grossProfit,
    netProfit: acc.netProfit + m.netProfit
  }), { totalOrders: 0, revenue: 0, cogs: 0, adSpend: 0, shippingCost: 0, grossProfit: 0, netProfit: 0 });

  res.json({ success: true, data: metrics, totals, count: metrics.length });
}));

router.get('/metrics/summary/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const days = parseInt(req.query.days) || 30;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const metrics = await DailyMetrics.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });

  const summary = metrics.reduce((acc, m) => ({
    totalOrders: acc.totalOrders + m.totalOrders,
    revenue: acc.revenue + m.revenue,
    cogs: acc.cogs + m.cogs,
    adSpend: acc.adSpend + m.adSpend,
    shippingCost: acc.shippingCost + m.shippingCost,
    grossProfit: acc.grossProfit + m.grossProfit,
    netProfit: acc.netProfit + m.netProfit,
    totalCustomers: acc.totalCustomers + m.totalCustomers,
    newCustomers: acc.newCustomers + m.newCustomers,
    returningCustomers: acc.returningCustomers + m.returningCustomers
  }), { 
    totalOrders: 0, revenue: 0, cogs: 0, adSpend: 0, shippingCost: 0, 
    grossProfit: 0, netProfit: 0, totalCustomers: 0, newCustomers: 0, returningCustomers: 0 
  });

  summary.grossProfitMargin = summary.revenue > 0 ? (summary.grossProfit / summary.revenue) * 100 : 0;
  summary.netProfitMargin = summary.revenue > 0 ? (summary.netProfit / summary.revenue) * 100 : 0;
  summary.roas = summary.adSpend > 0 ? summary.revenue / summary.adSpend : 0;
  summary.poas = summary.adSpend > 0 ? summary.netProfit / summary.adSpend : 0;
  summary.aov = summary.totalOrders > 0 ? summary.revenue / summary.totalOrders : 0;

  res.json({ success: true, data: summary, days, dailyMetrics: metrics });
}));

module.exports = router;
