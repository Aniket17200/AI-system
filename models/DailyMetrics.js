const mongoose = require('mongoose');

const dailyMetricsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  
  // Revenue & Orders
  totalOrders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  
  // Costs
  cogs: { type: Number, default: 0 },
  adSpend: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  
  // Profit
  grossProfit: { type: Number, default: 0 },
  grossProfitMargin: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  netProfitMargin: { type: Number, default: 0 },
  
  // Marketing
  roas: { type: Number, default: 0 },
  poas: { type: Number, default: 0 },
  aov: { type: Number, default: 0 },
  cpp: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  cpm: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  linkClicks: { type: Number, default: 0 },
  
  // Customers
  newCustomers: { type: Number, default: 0 },
  returningCustomers: { type: Number, default: 0 },
  totalCustomers: { type: Number, default: 0 },
  returningRate: { type: Number, default: 0 },
  
  // Shipping
  totalShipments: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  inTransit: { type: Number, default: 0 },
  rto: { type: Number, default: 0 },
  ndr: { type: Number, default: 0 },
  deliveryRate: { type: Number, default: 0 },
  rtoRate: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

dailyMetricsSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyMetrics', dailyMetricsSchema);
