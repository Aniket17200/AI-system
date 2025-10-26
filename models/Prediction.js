const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  predictionType: {
    type: String,
    enum: ['3month', '7day', '30day'],
    default: '3month'
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  dataPointsUsed: Number,
  
  // Predictions data
  predictions: {
    monthly: [{
      month: String,
      year: Number,
      revenue: Number,
      orders: Number,
      profit: Number,
      adSpend: Number,
      roas: Number,
      profitMargin: Number
    }],
    summary: {
      totalRevenue: Number,
      totalOrders: Number,
      totalProfit: Number,
      avgROAS: Number,
      avgProfitMargin: Number
    }
  },
  
  // AI insights
  insights: [{
    type: {
      type: String,
      enum: ['positive', 'warning', 'neutral']
    },
    metric: String,
    message: String,
    recommendation: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  
  // Risks and opportunities
  risks: [String],
  opportunities: [String],
  
  // Metadata
  aiGenerated: {
    type: Boolean,
    default: false
  },
  pineconeVectorId: String,
  
  // Historical data snapshot
  historicalSnapshot: {
    startDate: Date,
    endDate: Date,
    avgRevenue: Number,
    avgOrders: Number,
    avgProfit: Number,
    revenueGrowthRate: Number
  }
}, {
  timestamps: true
});

// Index for fast lookups
predictionSchema.index({ userId: 1, predictionType: 1, generatedAt: -1 });
predictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to get latest valid prediction
predictionSchema.statics.getLatestPrediction = async function(userId, predictionType = '3month') {
  return this.findOne({
    userId,
    predictionType,
    expiresAt: { $gt: new Date() }
  }).sort({ generatedAt: -1 });
};

// Static method to check if prediction needs refresh
predictionSchema.statics.needsRefresh = async function(userId, predictionType = '3month', maxAgeHours = 24) {
  const latest = await this.getLatestPrediction(userId, predictionType);
  if (!latest) return true;
  
  const ageHours = (Date.now() - latest.generatedAt.getTime()) / (1000 * 60 * 60);
  return ageHours > maxAgeHours;
};

module.exports = mongoose.model('Prediction', predictionSchema);
