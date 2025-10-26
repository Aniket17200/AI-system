const DailyMetrics = require('../models/DailyMetrics');

/**
 * Simple Linear Regression for predictions
 */
function linearRegression(data) {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  data.forEach((point, index) => {
    const x = index;
    const y = point;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate moving average
 */
function movingAverage(data, window = 7) {
  if (data.length < window) return data[data.length - 1] || 0;
  
  const recent = data.slice(-window);
  return recent.reduce((sum, val) => sum + val, 0) / window;
}

/**
 * Calculate growth rate
 */
function calculateGrowthRate(data) {
  if (data.length < 2) return 0;
  
  const recent = data.slice(-7);
  const older = data.slice(-14, -7);
  
  if (older.length === 0 || recent.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
  
  if (olderAvg === 0) return 0;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

/**
 * Predict next 7 days using linear regression
 */
function predictNextDays(historicalData, days = 7) {
  const { slope, intercept } = linearRegression(historicalData);
  const predictions = [];
  const startIndex = historicalData.length;
  
  for (let i = 0; i < days; i++) {
    const predicted = slope * (startIndex + i) + intercept;
    predictions.push(Math.max(0, predicted)); // Ensure non-negative
  }
  
  return predictions;
}

/**
 * Generate AI predictions based on historical data
 */
async function generatePredictions(userId, startDate, endDate) {
  try {
    // Fetch historical data (last 30 days before the date range)
    const historicalStartDate = new Date(startDate);
    historicalStartDate.setDate(historicalStartDate.getDate() - 30);
    
    const metrics = await DailyMetrics.find({
      userId,
      date: {
        $gte: historicalStartDate,
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });

    if (metrics.length === 0) {
      return {
        predictions: [],
        insights: [],
        confidence: 0
      };
    }

    // Extract time series data
    const revenue = metrics.map(m => m.revenue || 0);
    const orders = metrics.map(m => m.totalOrders || 0);
    const adSpend = metrics.map(m => m.adSpend || 0);
    const netProfit = metrics.map(m => m.netProfit || 0);

    // Calculate current metrics
    const currentRevenue = movingAverage(revenue);
    const currentOrders = movingAverage(orders);
    const currentAdSpend = movingAverage(adSpend);
    const currentNetProfit = movingAverage(netProfit);
    
    // Calculate ROAS properly from total revenue and total ad spend
    const totalRevenue = revenue.reduce((sum, val) => sum + val, 0);
    const totalAdSpend = adSpend.reduce((sum, val) => sum + val, 0);
    const currentROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    // Calculate growth rates
    const revenueGrowth = calculateGrowthRate(revenue);
    const ordersGrowth = calculateGrowthRate(orders);
    const profitGrowth = calculateGrowthRate(netProfit);

    // Predict next 7 days
    const revenuePredictions = predictNextDays(revenue, 7);
    const ordersPredictions = predictNextDays(orders, 7);
    const profitPredictions = predictNextDays(netProfit, 7);

    // Calculate predicted totals
    const predictedRevenue = revenuePredictions.reduce((sum, val) => sum + val, 0);
    const predictedOrders = Math.round(ordersPredictions.reduce((sum, val) => sum + val, 0));
    const predictedProfit = profitPredictions.reduce((sum, val) => sum + val, 0);

    // Generate insights
    const insights = [];

    // Revenue insights
    if (revenueGrowth > 10) {
      insights.push({
        type: 'positive',
        metric: 'Revenue',
        message: `Revenue is growing at ${revenueGrowth.toFixed(1)}% week-over-week. Strong upward trend detected.`,
        recommendation: 'Consider increasing ad spend to capitalize on this momentum.'
      });
    } else if (revenueGrowth < -10) {
      insights.push({
        type: 'warning',
        metric: 'Revenue',
        message: `Revenue is declining at ${Math.abs(revenueGrowth).toFixed(1)}% week-over-week.`,
        recommendation: 'Review marketing campaigns and consider promotional strategies.'
      });
    } else {
      insights.push({
        type: 'neutral',
        metric: 'Revenue',
        message: `Revenue is stable with ${revenueGrowth.toFixed(1)}% growth.`,
        recommendation: 'Maintain current strategies while testing new growth initiatives.'
      });
    }

    // ROAS insights
    if (currentROAS > 3) {
      insights.push({
        type: 'positive',
        metric: 'ROAS',
        message: `Excellent ROAS of ${currentROAS.toFixed(2)}x. Your ads are highly profitable.`,
        recommendation: 'Scale winning campaigns and increase budget allocation.'
      });
    } else if (currentROAS < 2) {
      insights.push({
        type: 'warning',
        metric: 'ROAS',
        message: `ROAS of ${currentROAS.toFixed(2)}x is below target. Ad efficiency needs improvement.`,
        recommendation: 'Optimize ad targeting, creative, and landing pages.'
      });
    }

    // Profit margin insights
    const profitMargin = currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0;
    if (profitMargin > 30) {
      insights.push({
        type: 'positive',
        metric: 'Profit Margin',
        message: `Strong profit margin of ${profitMargin.toFixed(1)}%.`,
        recommendation: 'Excellent profitability. Consider reinvesting in growth.'
      });
    } else if (profitMargin < 15) {
      insights.push({
        type: 'warning',
        metric: 'Profit Margin',
        message: `Profit margin of ${profitMargin.toFixed(1)}% is below healthy levels.`,
        recommendation: 'Review COGS, shipping costs, and ad spend efficiency.'
      });
    }

    // Order volume insights
    if (ordersGrowth > 15) {
      insights.push({
        type: 'positive',
        metric: 'Orders',
        message: `Order volume growing at ${ordersGrowth.toFixed(1)}% week-over-week.`,
        recommendation: 'Ensure inventory and fulfillment capacity can handle growth.'
      });
    }

    // Calculate confidence score (0-100)
    const dataPoints = metrics.length;
    const variability = calculateVariability(revenue);
    const confidence = Math.min(100, Math.max(0, 
      (dataPoints / 30) * 50 + // More data = higher confidence
      (100 - variability) * 0.5 // Lower variability = higher confidence
    ));

    return {
      predictions: {
        next7Days: {
          revenue: predictedRevenue,
          orders: predictedOrders,
          profit: predictedProfit,
          dailyBreakdown: revenuePredictions.map((rev, i) => ({
            day: i + 1,
            revenue: rev,
            orders: Math.round(ordersPredictions[i]),
            profit: profitPredictions[i]
          }))
        },
        current: {
          revenue: currentRevenue,
          orders: currentOrders,
          adSpend: currentAdSpend,
          netProfit: currentNetProfit,
          roas: currentROAS,
          profitMargin
        },
        growth: {
          revenue: revenueGrowth,
          orders: ordersGrowth,
          profit: profitGrowth
        }
      },
      insights,
      confidence: Math.round(confidence),
      dataPoints
    };

  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

/**
 * Calculate coefficient of variation (measure of variability)
 */
function calculateVariability(data) {
  if (data.length === 0) return 100;
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  if (mean === 0) return 100;
  
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.min(100, (stdDev / mean) * 100);
}

module.exports = {
  generatePredictions
};
