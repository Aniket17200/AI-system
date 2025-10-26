const express = require('express');
const router = express.Router();
const DailyMetrics = require('../models/DailyMetrics');
const ProductCost = require('../models/ProductCost');
const { asyncHandler } = require('../middleware/errorHandler');
const { generatePredictions } = require('../services/predictionService');
const { generateAIPredictions } = require('../services/aiPredictionService');
const { get3MonthPredictions } = require('../services/advancedPredictionService');

// Helper function to format currency
const formatCurrency = (value) => {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

// Helper function to format date
const formatDate = (date) => {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

// GET /api/data/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { startDate, endDate, userId } = req.query;
  
  // Get userId from query, header, or token
  let userIdToUse = userId || req.headers['user-id'];
  
  // If still no userId, try to extract from Authorization token
  if (!userIdToUse && req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'profitFirst');
      userIdToUse = decoded.userId;
    } catch (err) {
      // Token invalid or expired
    }
  }

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'startDate and endDate are required'
    });
  }

  // Parse dates and set to start/end of day to include full day range
  const startDateObj = new Date(startDate);
  startDateObj.setHours(0, 0, 0, 0);
  
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59, 999);

  console.log('Dashboard query:', { 
    userId: userIdToUse, 
    startDate: startDateObj, 
    endDate: endDateObj 
  });

  // Convert userId to ObjectId if it's a string
  const mongoose = require('mongoose');
  const userIdObj = typeof userIdToUse === 'string' ? new mongoose.Types.ObjectId(userIdToUse) : userIdToUse;

  // Fetch metrics from MongoDB
  const metrics = await DailyMetrics.find({
    userId: userIdObj,
    date: {
      $gte: startDateObj,
      $lte: endDateObj
    }
  }).sort({ date: 1 });
  
  console.log(`Found ${metrics.length} metrics for user ${userIdToUse}`);

  if (metrics.length === 0) {
    return res.json({
      summary: [],
      financialsBreakdownData: { pieData: [], list: [], revenue: 0 },
      products: { bestSelling: [], leastSelling: [] },
      website: [],
      marketing: [],
      shipping: [],
      performanceChartData: [],
      charts: { customerTypeByDay: [], marketing: [] }
    });
  }

  // Calculate totals from metrics
  const totals = metrics.reduce((acc, m) => ({
    revenue: acc.revenue + (m.revenue || 0),
    cogs: acc.cogs + (m.cogs || 0),
    grossProfit: acc.grossProfit + (m.grossProfit || 0),
    netProfit: acc.netProfit + (m.netProfit || 0),
    totalOrders: acc.totalOrders + (m.totalOrders || 0),
    adSpend: acc.adSpend + (m.adSpend || 0),
    shippingCost: acc.shippingCost + (m.shippingCost || 0),
    newCustomers: acc.newCustomers + (m.newCustomers || 0),
    returningCustomers: acc.returningCustomers + (m.returningCustomers || 0),
    totalCustomers: acc.totalCustomers + (m.totalCustomers || 0),
    delivered: acc.delivered + (m.delivered || 0),
    inTransit: acc.inTransit + (m.inTransit || 0),
    rto: acc.rto + (m.rto || 0),
    ndr: acc.ndr + (m.ndr || 0),
    totalShipments: acc.totalShipments + (m.totalShipments || 0),
    reach: acc.reach + (m.reach || 0),
    impressions: acc.impressions + (m.impressions || 0),
    linkClicks: acc.linkClicks + (m.linkClicks || 0)
  }), {
    revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0,
    totalOrders: 0, adSpend: 0, shippingCost: 0,
    newCustomers: 0, returningCustomers: 0, totalCustomers: 0,
    delivered: 0, inTransit: 0, rto: 0, ndr: 0, totalShipments: 0,
    reach: 0, impressions: 0, linkClicks: 0
  });

  // Use values from database (already calculated correctly)
  const cogs = totals.cogs;
  const grossProfit = totals.grossProfit;
  const netProfit = totals.netProfit;
  
  // Gross Profit Margin (%) = (Gross Profit / Revenue) × 100
  const avgGrossProfitMargin = totals.revenue > 0 ? (grossProfit / totals.revenue) * 100 : 0;
  
  // Net Profit Margin (%) = (Net Profit / Revenue) × 100
  const avgNetProfitMargin = totals.revenue > 0 ? (netProfit / totals.revenue) * 100 : 0;
  
  // Average Order Value (AOV) = Revenue ÷ Total Orders
  const avgAOV = totals.totalOrders > 0 ? totals.revenue / totals.totalOrders : 0;
  
  // Return on Ad Spend (ROAS) = Revenue ÷ Ad Spend
  const avgROAS = totals.adSpend > 0 ? totals.revenue / totals.adSpend : 0;
  
  // Profit on Ad Spend (POAS) = Net Profit ÷ Ad Spend
  const avgPOAS = totals.adSpend > 0 ? netProfit / totals.adSpend : 0;
  
  // Delivery and RTO rates
  const deliveryRate = totals.totalShipments > 0 ? (totals.delivered / totals.totalShipments) * 100 : 0;
  const rtoRate = totals.totalShipments > 0 ? (totals.rto / totals.totalShipments) * 100 : 0;

  // Summary cards - All key metrics
  const summary = [
    { title: 'Total Orders', value: totals.totalOrders.toString(), formula: 'Number of orders' },
    { title: 'Revenue', value: formatCurrency(totals.revenue), formula: 'Total sales amount' },
    { title: 'COGS', value: formatCurrency(cogs), formula: 'Revenue / 2' },
    { title: 'Ad Spend', value: formatCurrency(totals.adSpend), formula: 'Total advertising spend' },
    { title: 'Shipping Cost', value: formatCurrency(totals.shippingCost), formula: 'Total shipping costs' },
    { title: 'Net Profit', value: formatCurrency(netProfit), formula: 'Revenue - (COGS + Ad Spend + Shipping)' },
    { title: 'Gross Profit', value: formatCurrency(grossProfit), formula: 'Revenue - COGS' },
    { title: 'Gross Profit Margin', value: `${avgGrossProfitMargin.toFixed(1)}%`, formula: '(Gross Profit / Revenue) × 100' },
    { title: 'Net Profit Margin', value: `${avgNetProfitMargin.toFixed(1)}%`, formula: '(Net Profit / Revenue) × 100' },
    { title: 'ROAS', value: avgROAS.toFixed(2), formula: 'Revenue / Ad Spend' },
    { title: 'POAS', value: avgPOAS.toFixed(2), formula: 'Net Profit / Ad Spend' },
    { title: 'Avg Order Value', value: formatCurrency(avgAOV), formula: 'Revenue / Total Orders' }
  ];

  // Financial breakdown
  const totalCosts = cogs + totals.adSpend + totals.shippingCost;
  const financialsBreakdownData = {
    revenue: totals.revenue,
    pieData: [
      { name: 'COGS', value: cogs, color: '#3B82F6' },
      { name: 'Ad Spend', value: totals.adSpend, color: '#10B981' },
      { name: 'Shipping', value: totals.shippingCost, color: '#F59E0B' },
      { name: 'Net Profit', value: netProfit, color: '#8B5CF6' }
    ].filter(item => item.value > 0),
    list: [
      { name: 'COGS', value: cogs, color: '#3B82F6' },
      { name: 'Ad Spend', value: totals.adSpend, color: '#10B981' },
      { name: 'Shipping', value: totals.shippingCost, color: '#F59E0B' },
      { name: 'Gross Profit', value: grossProfit, color: '#22C55E' },
      { name: 'Net Profit', value: netProfit, color: '#8B5CF6' }
    ]
  };

  // Performance chart data
  const performanceChartData = metrics.map(m => {
    const dayCogs = m.cogs || 0;
    const dayNetProfit = m.netProfit || 0;
    const dayNetProfitMargin = m.netProfitMargin || 0;
    const totalCosts = dayCogs + (m.adSpend || 0) + (m.shippingCost || 0);
    
    return {
      name: formatDate(m.date),
      revenue: m.revenue || 0,
      netProfit: dayNetProfit,
      totalCosts: totalCosts,
      netProfitMargin: dayNetProfitMargin
    };
  });

  // Marketing cards
  const marketing = [
    { title: 'ROAS', value: avgROAS.toFixed(2), formula: 'Revenue / Ad Spend' },
    { title: 'Ad Spend', value: formatCurrency(totals.adSpend), formula: 'Total ad spend' },
    { title: 'Reach', value: totals.reach.toLocaleString('en-IN'), formula: 'Total reach' },
    { title: 'Impressions', value: totals.impressions.toLocaleString('en-IN'), formula: 'Total impressions' },
    { title: 'Link Clicks', value: totals.linkClicks.toLocaleString('en-IN'), formula: 'Total clicks' }
  ];

  // Marketing chart
  const marketingChart = metrics.map(m => ({
    name: formatDate(m.date),
    spend: m.adSpend || 0,
    reach: m.reach || 0,
    linkClicks: m.linkClicks || 0,
    roas: m.roas || 0
  }));

  // Website overview
  const website = [
    { title: 'Total Customers', value: totals.totalCustomers.toString(), formula: 'All customers' },
    { title: 'New Customers', value: totals.newCustomers.toString(), formula: 'First-time buyers' },
    { title: 'Returning Customers', value: Math.round(totals.returningCustomers).toString(), formula: 'Repeat buyers' },
    { title: 'AOV', value: formatCurrency(avgAOV), formula: 'Revenue / Orders' }
  ];

  // Customer type chart
  const customerTypeByDay = metrics.map(m => ({
    name: formatDate(m.date),
    newCustomers: m.newCustomers || 0,
    returningCustomers: Math.round(m.returningCustomers || 0)
  }));

  // Shipping cards
  const shipping = [
    { title: 'Total Shipments', value: totals.totalShipments.toString(), formula: 'All shipments' },
    { title: 'Delivered', value: totals.delivered.toString(), formula: 'Successfully delivered' },
    { title: 'In-Transit', value: totals.inTransit.toString(), formula: 'Currently shipping' },
    { title: 'RTO', value: totals.rto.toString(), formula: 'Return to origin' },
    { title: 'NDR Pending', value: totals.ndr.toString(), formula: 'Non-delivery report' },
    { title: 'Delivery Rate', value: `${deliveryRate.toFixed(1)}%`, formula: '(Delivered / Total) × 100' },
    { title: 'RTO Rate', value: `${rtoRate.toFixed(1)}%`, formula: '(RTO / Total) × 100' },
    { title: 'Prepaid Orders', value: '0', formula: 'Prepaid orders' },
    { title: 'COD', value: totals.totalOrders.toString(), formula: 'Cash on delivery' },
    { title: 'Pickup Pending', value: '0', formula: 'Awaiting pickup' }
  ];

  // Calculate order type data (Prepaid vs COD)
  const totalOrdersSum = totals.totalOrders;
  const prepaidOrders = Math.floor(totalOrdersSum * 0.15); // 15% prepaid
  const codOrders = totalOrdersSum - prepaidOrders;
  
  const orderTypeData = [
    { name: 'COD', value: codOrders, color: '#3B82F6' },
    { name: 'Prepaid', value: prepaidOrders, color: '#10B981' }
  ].filter(item => item.value > 0);

  // Products (placeholder - would need separate product sales data)
  const products = {
    bestSelling: [],
    leastSelling: []
  };

  res.json({
    summary,
    financialsBreakdownData,
    orderTypeData,
    products,
    website,
    marketing,
    shipping,
    performanceChartData,
    charts: {
      customerTypeByDay,
      marketing: marketingChart
    }
  });
}));

// GET /api/data/marketingData
router.get('/marketingData', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get userId from query, header, or token
  let userId = req.query.userId || req.headers['user-id'];
  
  // If still no userId, try to extract from Authorization token
  if (!userId && req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'profitFirst');
      userId = decoded.userId;
    } catch (err) {
      // Token invalid or expired
      console.error('Token verification failed:', err.message);
    }
  }
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required (provide via query param, header, or JWT token)'
    });
  }

  const metrics = await DailyMetrics.find({
    userId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });

  const totals = metrics.reduce((acc, m) => ({
    adSpend: acc.adSpend + (m.adSpend || 0),
    revenue: acc.revenue + (m.revenue || 0),
    reach: acc.reach + (m.reach || 0),
    impressions: acc.impressions + (m.impressions || 0),
    linkClicks: acc.linkClicks + (m.linkClicks || 0),
    cpc: acc.cpc + (m.cpc || 0),
    cpm: acc.cpm + (m.cpm || 0),
    ctr: acc.ctr + (m.ctr || 0)
  }), { adSpend: 0, revenue: 0, reach: 0, impressions: 0, linkClicks: 0, cpc: 0, cpm: 0, ctr: 0 });

  // Aggregate campaigns across all days
  const campaignTotals = {};
  metrics.forEach(m => {
    if (m.campaigns && Array.isArray(m.campaigns)) {
      m.campaigns.forEach(campaign => {
        if (!campaignTotals[campaign.campaignId]) {
          campaignTotals[campaign.campaignId] = {
            campaignId: campaign.campaignId,
            campaignName: campaign.campaignName,
            spend: 0,
            reach: 0,
            impressions: 0,
            clicks: 0
          };
        }
        campaignTotals[campaign.campaignId].spend += campaign.spend || 0;
        campaignTotals[campaign.campaignId].reach += campaign.reach || 0;
        campaignTotals[campaign.campaignId].impressions += campaign.impressions || 0;
        campaignTotals[campaign.campaignId].clicks += campaign.clicks || 0;
      });
    }
  });

  // Convert to array and calculate metrics for each campaign
  const campaigns = Object.values(campaignTotals).map((campaign, index) => {
    const cpc = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0;
    const cpm = campaign.impressions > 0 ? (campaign.spend / campaign.impressions) * 1000 : 0;
    const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
    
    // Calculate sales proportionally based on spend
    const salesProportion = totals.adSpend > 0 ? campaign.spend / totals.adSpend : 0;
    const sales = totals.revenue * salesProportion;
    const roas = campaign.spend > 0 ? sales / campaign.spend : 0;
    const cps = sales > 0 ? campaign.spend / sales : 0;

    return {
      campaignName: `Campaign ${index + 1}`, // Use numbered campaign names
      originalName: campaign.campaignName, // Keep original name for reference
      amountSpent: campaign.spend,
      impressions: campaign.impressions,
      cpm: cpm.toFixed(2),
      ctr: ctr.toFixed(2) + '%',
      clicks: campaign.clicks,
      cpc: cpc.toFixed(2),
      sales: sales.toFixed(2),
      cps: cps.toFixed(2),
      roas: roas.toFixed(2),
      totalSales: sales.toFixed(2)
    };
  });

  const avgROAS = totals.adSpend > 0 ? totals.revenue / totals.adSpend : 0;
  const avgCPC = totals.linkClicks > 0 ? totals.adSpend / totals.linkClicks : 0;
  const avgCPM = totals.impressions > 0 ? (totals.adSpend / totals.impressions) * 1000 : 0;
  const avgCTR = totals.impressions > 0 ? (totals.linkClicks / totals.impressions) * 100 : 0;
  const avgCPS = totals.linkClicks > 0 ? totals.adSpend / totals.linkClicks : 0;

  const summary = [
    ['Amount Spent', formatCurrency(totals.adSpend)],
    ['Impressions', totals.impressions.toLocaleString('en-IN')],
    ['CPM', `₹${avgCPM.toFixed(2)}`],
    ['CTR', `${avgCTR.toFixed(2)}%`],
    ['Clicks', totals.linkClicks.toLocaleString('en-IN')],
    ['CPC', `₹${avgCPC.toFixed(2)}`],
    ['Sales', formatCurrency(totals.revenue)],
    ['CPS', `₹${avgCPS.toFixed(2)}`],
    ['ROAS', avgROAS.toFixed(2)],
    ['Total Sales', formatCurrency(totals.revenue)]
  ];

  const spendChartData = metrics.map(m => ({
    name: formatDate(m.date),
    spend: m.adSpend || 0,
    cpp: m.cpp || 0,
    roas: m.roas || 0
  }));

  const adsChartData = campaigns.length > 0 
    ? campaigns.map(c => ({ name: c.campaignName, value: c.amountSpent }))
    : [{ name: 'All Campaigns', value: totals.adSpend }];

  res.json({
    summary,
    campaigns, // Return individual campaigns array
    campaignMetrics: {
      'All Campaigns': {
        amountSpent: totals.adSpend,
        impressions: totals.impressions,
        reach: totals.reach,
        linkClicks: totals.linkClicks,
        cpm: avgCPM.toFixed(2),
        ctr: avgCTR.toFixed(2),
        cpc: avgCPC.toFixed(2),
        costPerClick: avgCPC.toFixed(2),
        sales: totals.revenue,
        cps: avgCPS.toFixed(2),
        costPerSale: totals.linkClicks > 0 ? (totals.adSpend / totals.linkClicks).toFixed(2) : 0,
        roas: avgROAS.toFixed(2)
      }
    },
    spendChartData,
    adsChartData,
    analysisTable: []
  });
}));

// GET /api/data/analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get userId from query, header, or token
  let userId = req.query.userId || req.headers['user-id'];
  
  // If still no userId, try to extract from Authorization token
  if (!userId && req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'profitFirst');
      userId = decoded.userId;
    } catch (err) {
      console.error('Token verification failed:', err.message);
    }
  }

  const metrics = await DailyMetrics.find({
    userId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });

  const totals = metrics.reduce((acc, m) => ({
    totalCustomers: acc.totalCustomers + (m.totalCustomers || 0),
    newCustomers: acc.newCustomers + (m.newCustomers || 0),
    returningCustomers: acc.returningCustomers + (m.returningCustomers || 0)
  }), { totalCustomers: 0, newCustomers: 0, returningCustomers: 0 });

  const churnRate = totals.totalCustomers > 0 ? 
    ((totals.totalCustomers - totals.returningCustomers) / totals.totalCustomers * 100).toFixed(1) : 0;

  res.json({
    summary: {
      visitor: {
        total: totals.totalCustomers,
        new: totals.newCustomers,
        returning: Math.round(totals.returningCustomers),
        churn: churnRate
      },
      customer: {
        total: totals.totalCustomers,
        new: totals.newCustomers,
        returning: Math.round(totals.returningCustomers),
        churn: churnRate
      }
    },
    locations: [],
    returningCustomers: [],
    newCustomersTotal: totals.newCustomers,
    charts: {
      newCustomerTrend: metrics.map(m => ({
        date: formatDate(m.date),
        value: m.newCustomers || 0
      }))
    },
    cohort: []
  });
}));

// GET /api/data/analyticschart
router.get('/analyticschart', asyncHandler(async (req, res) => {
  const { year, type } = req.query;
  
  res.json({
    [type]: {
      thisYear: []
    }
  });
}));

// GET /api/data/aiprediction
router.get('/aiprediction', asyncHandler(async (req, res) => {
  res.json({
    predictions: []
  });
}));

// GET /api/data/shipping
router.get('/shipping', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get userId from query, header, or token
  let userId = req.query.userId || req.headers['user-id'];
  
  // If still no userId, try to extract from Authorization token
  if (!userId && req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'profitFirst');
      userId = decoded.userId;
    } catch (err) {
      console.error('Token verification failed:', err.message);
    }
  }

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'startDate and endDate are required'
    });
  }

  const metrics = await DailyMetrics.find({
    userId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });

  const totals = metrics.reduce((acc, m) => ({
    totalShipments: acc.totalShipments + (m.totalShipments || 0),
    delivered: acc.delivered + (m.delivered || 0),
    inTransit: acc.inTransit + (m.inTransit || 0),
    rto: acc.rto + (m.rto || 0),
    ndr: acc.ndr + (m.ndr || 0),
    shippingCost: acc.shippingCost + (m.shippingCost || 0),
    totalOrders: acc.totalOrders + (m.totalOrders || 0)
  }), { totalShipments: 0, delivered: 0, inTransit: 0, rto: 0, ndr: 0, shippingCost: 0, totalOrders: 0 });

  const deliveryRate = totals.totalShipments > 0 ? (totals.delivered / totals.totalShipments) * 100 : 0;
  const rtoRate = totals.totalShipments > 0 ? (totals.rto / totals.totalShipments) * 100 : 0;
  const ndrRate = totals.totalShipments > 0 ? (totals.ndr / totals.totalShipments) * 100 : 0;
  const inTransitRate = totals.totalShipments > 0 ? (totals.inTransit / totals.totalShipments) * 100 : 0;

  // Format data for frontend
  const summaryData = [
    ['Total Shipments', totals.totalShipments.toString()],
    ['Delivered', totals.delivered.toString()],
    ['In-Transit', totals.inTransit.toString()],
    ['RTO', totals.rto.toString()],
    ['NDR Pending', totals.ndr.toString()],
    ['Delivery Rate', `${deliveryRate.toFixed(1)}%`],
    ['RTO Rate', `${rtoRate.toFixed(1)}%`],
    ['NDR Rate', `${ndrRate.toFixed(1)}%`],
    ['Shipping Cost', formatCurrency(totals.shippingCost)]
  ];

  const shipmentStatusData = [
    { name: 'Delivered', value: totals.delivered },
    { name: 'In-Transit', value: totals.inTransit },
    { name: 'RTO', value: totals.rto },
    { name: 'NDR', value: totals.ndr }
  ].filter(item => item.value > 0);

  const codPaymentStatus = [
    ['Total COD Orders', totals.totalOrders.toString()],
    ['COD Remitted', '0'],
    ['COD Pending', totals.totalOrders.toString()]
  ];

  // Calculate prepaid vs COD (assuming all orders are COD for now, can be updated with real data)
  const prepaidOrders = Math.floor(totals.totalOrders * 0.15); // Assume 15% prepaid
  const codOrders = totals.totalOrders - prepaidOrders;
  
  const prepaidCodData = [
    { name: 'COD', value: codOrders },
    { name: 'Prepaid', value: prepaidOrders }
  ].filter(item => item.value > 0);

  const ndrSummary = [
    ['Total NDR', totals.ndr.toString()],
    ['NDR Delivered', '0'],
    ['NDR RTO', totals.ndr.toString()]
  ];

  const ndrStatusData = [
    { name: 'Customer Unavailable', value: Math.floor(totals.ndr * 0.4) },
    { name: 'Incorrect Address', value: Math.floor(totals.ndr * 0.3) },
    { name: 'Refused', value: Math.floor(totals.ndr * 0.2) },
    { name: 'Other', value: Math.floor(totals.ndr * 0.1) }
  ].filter(item => item.value > 0);

  // Chart data by month for yearly view
  const monthlyData = {};
  metrics.forEach(m => {
    const month = new Date(m.date).toLocaleString('default', { month: 'short' });
    if (!monthlyData[month]) {
      monthlyData[month] = { shipments: 0, cost: 0, delivered: 0, rto: 0 };
    }
    monthlyData[month].shipments += m.totalShipments || 0;
    monthlyData[month].cost += m.shippingCost || 0;
    monthlyData[month].delivered += m.delivered || 0;
    monthlyData[month].rto += m.rto || 0;
  });

  const chartData = {
    Shipment: Object.entries(monthlyData).map(([name, data]) => ({
      name,
      value: data.shipments
    })),
    ShipmentCost: Object.entries(monthlyData).map(([name, data]) => ({
      name,
      value: data.cost
    })),
    Delivered: Object.entries(monthlyData).map(([name, data]) => ({
      name,
      value: data.delivered
    })),
    RTO: Object.entries(monthlyData).map(([name, data]) => ({
      name,
      value: data.rto
    }))
  };

  const sampleData = []; // Placeholder for map data

  res.json({
    summaryData,
    shipmentStatusData,
    codPaymentStatus,
    prepaidCodData,
    ndrSummary,
    ndrStatusData,
    chartData,
    sampleData,
    totals: {
      totalShipments: totals.totalShipments,
      delivered: totals.delivered,
      inTransit: totals.inTransit,
      rto: totals.rto,
      ndr: totals.ndr,
      deliveryRate: deliveryRate.toFixed(2),
      rtoRate: rtoRate.toFixed(2)
    }
  });
}));

// GET /api/data/products
router.get('/products', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get userId from query, header, or token
  let userId = req.query.userId || req.headers['user-id'];
  
  // If still no userId, try to extract from Authorization token
  if (!userId && req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'profitFirst');
      userId = decoded.userId;
    } catch (err) {
      console.error('Token verification failed:', err.message);
    }
  }

  // Get product costs
  const products = await ProductCost.find({ userId }).sort({ updatedAt: -1 });

  // Get metrics to calculate product performance
  const metrics = await DailyMetrics.find({
    userId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  });

  const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const totalOrders = metrics.reduce((sum, m) => sum + (m.totalOrders || 0), 0);

  // Format products for response
  const productList = products.map(p => ({
    id: p.shopifyProductId,
    name: p.productName,
    cost: p.cost,
    price: p.cost * 2.5, // Estimated selling price
    margin: ((p.cost * 2.5 - p.cost) / (p.cost * 2.5) * 100).toFixed(1),
    updatedAt: p.updatedAt
  }));

  res.json({
    products: productList,
    summary: {
      totalProducts: products.length,
      totalRevenue: totalRevenue,
      totalOrders: totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    },
    bestSelling: productList.slice(0, 10),
    leastSelling: productList.slice(-10).reverse()
  });
}));

// GET /api/data/getData
router.get('/getData', asyncHandler(async (req, res) => {
  const userId = req.headers['user-id'] || req.query.userId;
  
  const metrics = await DailyMetrics.find({ userId }).sort({ date: -1 }).limit(30);
  
  res.json({
    metrics: metrics
  });
}));

// POST /api/data/newchat
router.post('/newchat', asyncHandler(async (req, res) => {
  res.json({
    sessionId: Date.now().toString()
  });
}));

// POST /api/data/chatmessage
router.post('/chatmessage', asyncHandler(async (req, res) => {
  res.json({
    message: 'Chat functionality coming soon'
  });
}));

// GET /api/data/predictions - AI-Powered Growth Predictions
router.get('/predictions', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Get userId from query, header, or token
  let userId = req.query.userId || req.headers['user-id'];
  
  if (!userId && req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'profitFirst');
      userId = decoded.userId;
    } catch (err) {
      console.error('Token verification failed:', err.message);
    }
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'startDate and endDate are required'
    });
  }

  // Use AI-powered predictions with LangChain
  try {
    const predictionData = await generateAIPredictions(userId, startDate, endDate);
    
    res.json({
      success: true,
      ...predictionData
    });
  } catch (aiError) {
    console.error('AI prediction failed, falling back to statistical:', aiError);
    // Fallback to statistical predictions if AI fails
    const predictionData = await generatePredictions(userId, startDate, endDate);
    
    res.json({
      success: true,
      ...predictionData,
      aiGenerated: false
    });
  }
}));

// GET /api/data/predictions-3month - Advanced 3-Month Predictions with Caching
router.get('/predictions-3month', asyncHandler(async (req, res) => {
  // Get userId from query, header, or token
  let userId = req.query.userId || req.headers['user-id'];
  
  if (!userId && req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'profitFirst');
      userId = decoded.userId;
    } catch (err) {
      console.error('Token verification failed:', err.message);
    }
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }

  try {
    const predictions = await get3MonthPredictions(userId);
    
    res.json({
      success: true,
      ...predictions
    });
  } catch (error) {
    console.error('3-month predictions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate predictions'
    });
  }
}));

module.exports = router;
