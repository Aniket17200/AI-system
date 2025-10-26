const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const DailyMetrics = require('../models/DailyMetrics');

/**
 * Enhanced AI Prediction Service using LangChain and OpenAI
 */

// Initialize OpenAI with LangChain
const initializeLLM = () => {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0.3, // Lower temperature for more consistent predictions
  });
};

/**
 * Analyze historical data and generate insights
 */
async function analyzeHistoricalData(metrics) {
  const revenue = metrics.map(m => m.revenue || 0);
  const orders = metrics.map(m => m.totalOrders || 0);
  const adSpend = metrics.map(m => m.adSpend || 0);
  const netProfit = metrics.map(m => m.netProfit || 0);
  const roas = metrics.map(m => m.roas || 0);
  const delivered = metrics.map(m => m.delivered || 0);
  const rto = metrics.map(m => m.rto || 0);

  // Calculate statistics
  const avgRevenue = revenue.reduce((a, b) => a + b, 0) / revenue.length;
  const avgOrders = orders.reduce((a, b) => a + b, 0) / orders.length;
  const avgAdSpend = adSpend.reduce((a, b) => a + b, 0) / adSpend.length;
  const avgNetProfit = netProfit.reduce((a, b) => a + b, 0) / netProfit.length;
  const avgROAS = roas.reduce((a, b) => a + b, 0) / roas.length;
  
  const deliveryRate = delivered.reduce((a, b) => a + b, 0) / 
                       (delivered.reduce((a, b) => a + b, 0) + rto.reduce((a, b) => a + b, 0)) * 100;

  // Calculate trends
  const recentRevenue = revenue.slice(-7);
  const olderRevenue = revenue.slice(-14, -7);
  const revenueGrowth = ((recentRevenue.reduce((a, b) => a + b, 0) / recentRevenue.length) - 
                         (olderRevenue.reduce((a, b) => a + b, 0) / olderRevenue.length)) / 
                         (olderRevenue.reduce((a, b) => a + b, 0) / olderRevenue.length) * 100;

  return {
    avgRevenue,
    avgOrders,
    avgAdSpend,
    avgNetProfit,
    avgROAS,
    deliveryRate,
    revenueGrowth,
    profitMargin: avgRevenue > 0 ? (avgNetProfit / avgRevenue) * 100 : 0,
    dataPoints: metrics.length
  };
}

/**
 * Generate AI-powered predictions using LangChain
 */
async function generateAIPredictions(userId, startDate, endDate) {
  try {
    // Fetch historical data
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
        predictions: null,
        insights: [],
        recommendations: [],
        confidence: 0,
        error: 'Insufficient data for predictions'
      };
    }

    // Analyze historical data
    const analysis = await analyzeHistoricalData(metrics);

    // Prepare data summary for AI
    const dataSummary = {
      totalDataPoints: metrics.length,
      avgDailyRevenue: analysis.avgRevenue,
      avgDailyOrders: analysis.avgOrders,
      avgDailyAdSpend: analysis.avgAdSpend,
      avgDailyProfit: analysis.avgNetProfit,
      avgROAS: analysis.avgROAS,
      profitMargin: analysis.profitMargin,
      deliveryRate: analysis.deliveryRate,
      revenueGrowthRate: analysis.revenueGrowth
    };

    // Create prompt for AI analysis
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert e-commerce business analyst. Analyze the following business metrics and provide predictions and insights.

Historical Data Summary:
- Data Points: {dataPoints} days
- Average Daily Revenue: ₹{avgRevenue}
- Average Daily Orders: {avgOrders}
- Average Daily Ad Spend: ₹{avgAdSpend}
- Average Daily Profit: ₹{avgProfit}
- Average ROAS: {avgROAS}x
- Profit Margin: {profitMargin}%
- Delivery Rate: {deliveryRate}%
- Revenue Growth Rate: {revenueGrowth}%

Based on this data, provide:
1. Predicted revenue for next 7 days (total)
2. Predicted orders for next 7 days (total)
3. Predicted profit for next 7 days (total)
4. 3-5 actionable insights with specific recommendations
5. Risk factors to watch
6. Growth opportunities

Format your response as JSON with this structure:
{{
  "predictions": {{
    "revenue": number,
    "orders": number,
    "profit": number,
    "confidence": number (0-100)
  }},
  "insights": [
    {{
      "type": "positive" | "warning" | "neutral",
      "metric": "string",
      "message": "string",
      "recommendation": "string",
      "priority": "high" | "medium" | "low"
    }}
  ],
  "risks": ["string"],
  "opportunities": ["string"]
}}

Provide realistic predictions based on the trends. Be specific and actionable.
`);

    const llm = initializeLLM();
    
    const formattedPrompt = await promptTemplate.format({
      dataPoints: dataSummary.totalDataPoints,
      avgRevenue: Math.round(dataSummary.avgDailyRevenue).toLocaleString('en-IN'),
      avgOrders: Math.round(dataSummary.avgDailyOrders),
      avgAdSpend: Math.round(dataSummary.avgDailyAdSpend).toLocaleString('en-IN'),
      avgProfit: Math.round(dataSummary.avgDailyProfit).toLocaleString('en-IN'),
      avgROAS: dataSummary.avgROAS.toFixed(2),
      profitMargin: dataSummary.profitMargin.toFixed(1),
      deliveryRate: dataSummary.deliveryRate.toFixed(1),
      revenueGrowth: dataSummary.revenueGrowthRate.toFixed(1)
    });

    console.log('Sending request to OpenAI...');
    const response = await llm.invoke(formattedPrompt);
    
    // Parse AI response
    let aiPredictions;
    try {
      const content = response.content;
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      aiPredictions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to statistical predictions
      aiPredictions = generateFallbackPredictions(analysis);
    }

    // Generate daily breakdown
    const dailyBreakdown = [];
    const dailyRevenue = aiPredictions.predictions.revenue / 7;
    const dailyOrders = Math.round(aiPredictions.predictions.orders / 7);
    const dailyProfit = aiPredictions.predictions.profit / 7;

    for (let i = 1; i <= 7; i++) {
      dailyBreakdown.push({
        day: i,
        revenue: dailyRevenue * (1 + (Math.random() * 0.2 - 0.1)), // Add slight variation
        orders: Math.round(dailyOrders * (1 + (Math.random() * 0.2 - 0.1))),
        profit: dailyProfit * (1 + (Math.random() * 0.2 - 0.1))
      });
    }

    return {
      predictions: {
        next7Days: {
          revenue: aiPredictions.predictions.revenue,
          orders: aiPredictions.predictions.orders,
          profit: aiPredictions.predictions.profit,
          dailyBreakdown
        },
        current: {
          revenue: analysis.avgRevenue,
          orders: analysis.avgOrders,
          adSpend: analysis.avgAdSpend,
          netProfit: analysis.avgNetProfit,
          roas: analysis.avgROAS,
          profitMargin: analysis.profitMargin
        },
        growth: {
          revenue: analysis.revenueGrowth,
          orders: ((analysis.avgOrders - metrics[0].totalOrders) / metrics[0].totalOrders) * 100,
          profit: ((analysis.avgNetProfit - metrics[0].netProfit) / metrics[0].netProfit) * 100
        }
      },
      insights: aiPredictions.insights || [],
      risks: aiPredictions.risks || [],
      opportunities: aiPredictions.opportunities || [],
      confidence: aiPredictions.predictions.confidence || 85,
      dataPoints: metrics.length,
      aiGenerated: true
    };

  } catch (error) {
    console.error('AI Prediction error:', error);
    throw error;
  }
}

/**
 * Fallback predictions using statistical methods
 */
function generateFallbackPredictions(analysis) {
  const growthFactor = 1 + (analysis.revenueGrowth / 100);
  
  return {
    predictions: {
      revenue: Math.round(analysis.avgRevenue * 7 * growthFactor),
      orders: Math.round(analysis.avgOrders * 7 * growthFactor),
      profit: Math.round(analysis.avgNetProfit * 7 * growthFactor),
      confidence: 75
    },
    insights: [
      {
        type: analysis.revenueGrowth > 5 ? 'positive' : analysis.revenueGrowth < -5 ? 'warning' : 'neutral',
        metric: 'Revenue Trend',
        message: `Revenue is ${analysis.revenueGrowth > 0 ? 'growing' : 'declining'} at ${Math.abs(analysis.revenueGrowth).toFixed(1)}%`,
        recommendation: analysis.revenueGrowth > 0 ? 'Continue current strategies' : 'Review marketing and pricing',
        priority: 'high'
      }
    ],
    risks: [],
    opportunities: []
  };
}

module.exports = {
  generateAIPredictions
};
