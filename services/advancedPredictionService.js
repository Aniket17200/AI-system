const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { Pinecone } = require('@pinecone-database/pinecone');
const DailyMetrics = require('../models/DailyMetrics');
const Prediction = require('../models/Prediction');

// Initialize Pinecone
let pineconeClient = null;
let pineconeIndex = null;

async function initializePinecone() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX_NAME || 'profitfirst-analytics');
  }
  return pineconeIndex;
}

/**
 * Generate embeddings for historical data using OpenAI
 */
async function generateEmbeddings(dataText) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: dataText
      })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    return null;
  }
}

/**
 * Store prediction in Pinecone for similarity search
 */
async function storePredictionInPinecone(userId, predictionData, embedding) {
  try {
    const index = await initializePinecone();
    const vectorId = `pred_${userId}_${Date.now()}`;
    
    await index.upsert([{
      id: vectorId,
      values: embedding,
      metadata: {
        userId: userId.toString(),
        type: 'prediction',
        generatedAt: new Date().toISOString(),
        revenue: predictionData.predictions.summary.totalRevenue,
        orders: predictionData.predictions.summary.totalOrders
      }
    }]);
    
    return vectorId;
  } catch (error) {
    console.error('Pinecone storage error:', error);
    return null;
  }
}

/**
 * Analyze historical data comprehensively
 */
async function analyzeHistoricalData(metrics) {
  const revenue = metrics.map(m => m.revenue || 0);
  const orders = metrics.map(m => m.totalOrders || 0);
  const adSpend = metrics.map(m => m.adSpend || 0);
  const netProfit = metrics.map(m => m.netProfit || 0);
  const roas = metrics.map(m => m.roas || 0);

  // Calculate averages
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  
  const avgRevenue = avg(revenue);
  const avgOrders = avg(orders);
  const avgAdSpend = avg(adSpend);
  const avgNetProfit = avg(netProfit);
  const avgROAS = avg(roas.filter(r => r > 0));
  
  // Calculate overall ROAS (more accurate)
  const totalRevenue = sum(revenue);
  const totalAdSpend = sum(adSpend);
  const calculatedROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

  // Calculate growth trends
  const recentRevenue = revenue.slice(-30);
  const olderRevenue = revenue.slice(-60, -30);
  const revenueGrowth = olderRevenue.length > 0 ? 
    ((avg(recentRevenue) - avg(olderRevenue)) / avg(olderRevenue)) * 100 : 0;

  // Calculate month-over-month growth
  const monthlyGrowth = [];
  for (let i = 30; i < revenue.length; i += 30) {
    const monthRevenue = revenue.slice(i - 30, i);
    if (monthRevenue.length > 0) {
      monthlyGrowth.push(sum(monthRevenue));
    }
  }

  // Calculate volatility
  const stdDev = (arr) => {
    const mean = avg(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };
  
  const revenueVolatility = avgRevenue > 0 ? (stdDev(revenue) / avgRevenue) * 100 : 0;

  return {
    avgRevenue,
    avgOrders,
    avgAdSpend,
    avgNetProfit,
    avgROAS,
    calculatedROAS, // More accurate ROAS
    totalRevenue,
    totalAdSpend,
    revenueGrowth,
    revenueVolatility,
    profitMargin: avgRevenue > 0 ? (avgNetProfit / avgRevenue) * 100 : 0,
    dataPoints: metrics.length,
    trend: revenueGrowth > 5 ? 'growing' : revenueGrowth < -5 ? 'declining' : 'stable',
    monthlyGrowth
  };
}

/**
 * Generate 3-month predictions using OpenAI with LangChain
 */
async function generate3MonthPredictions(userId) {
  let metrics = null;
  let analysis = null;
  
  try {
    console.log(`Generating 3-month predictions for user ${userId}...`);
    
    // Check if we have a recent cached prediction
    const cachedPrediction = await Prediction.getLatestPrediction(userId, '3month');
    if (cachedPrediction && !await Prediction.needsRefresh(userId, '3month', 24)) {
      console.log('Using cached prediction');
      return {
        ...cachedPrediction.toObject(),
        cached: true
      };
    }

    // Fetch historical data (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);
    
    metrics = await DailyMetrics.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    if (metrics.length < 30) {
      throw new Error('Insufficient data for 3-month predictions (minimum 30 days required)');
    }

    // Analyze historical data
    analysis = await analyzeHistoricalData(metrics);

    // Create data summary for AI
    const dataSummary = `
Historical Business Data (Last ${metrics.length} days):
- Average Daily Revenue: ₹${Math.round(analysis.avgRevenue).toLocaleString('en-IN')}
- Average Daily Orders: ${Math.round(analysis.avgOrders)}
- Average Daily Profit: ₹${Math.round(analysis.avgNetProfit).toLocaleString('en-IN')}
- Average ROAS: ${analysis.avgROAS.toFixed(2)}x
- Profit Margin: ${analysis.profitMargin.toFixed(1)}%
- Revenue Growth Rate: ${analysis.revenueGrowth.toFixed(1)}%
- Revenue Volatility: ${analysis.revenueVolatility.toFixed(1)}%
- Trend: ${analysis.trend}
`;

    // Generate embeddings for Pinecone
    const embedding = await generateEmbeddings(dataSummary);

    // Create prompt for 3-month prediction
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert e-commerce business analyst with deep knowledge of growth patterns and market trends.

Analyze this business data and provide detailed 3-month predictions:

{dataSummary}

Based on this data, provide predictions for the NEXT 3 MONTHS with:

1. Monthly breakdown (Month 1, Month 2, Month 3):
   - Revenue (total for the month)
   - Orders (total for the month)
   - Profit (total for the month)
   - Ad Spend (recommended)
   - ROAS (expected)
   - Profit Margin (expected %)

2. 5-7 actionable insights with:
   - Type (positive/warning/neutral)
   - Metric being analyzed
   - Detailed message
   - Specific recommendation
   - Priority (high/medium/low)

3. 3-5 risk factors to watch

4. 3-5 growth opportunities

5. Confidence score (0-100) based on data quality and trends

Format your response as JSON:
{{
  "predictions": {{
    "monthly": [
      {{
        "month": "Month 1",
        "revenue": number,
        "orders": number,
        "profit": number,
        "adSpend": number,
        "roas": number,
        "profitMargin": number
      }}
    ],
    "summary": {{
      "totalRevenue": number,
      "totalOrders": number,
      "totalProfit": number,
      "avgROAS": number,
      "avgProfitMargin": number
    }}
  }},
  "insights": [
    {{
      "type": "positive|warning|neutral",
      "metric": "string",
      "message": "string",
      "recommendation": "string",
      "priority": "high|medium|low"
    }}
  ],
  "risks": ["string"],
  "opportunities": ["string"],
  "confidence": number
}}

Be realistic and consider:
- Current growth trends
- Seasonality
- Market conditions
- Business sustainability
`);

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
    });

    const formattedPrompt = await promptTemplate.format({ dataSummary });
    
    console.log('Sending request to OpenAI for 3-month predictions...');
    const response = await llm.invoke(formattedPrompt);
    
    // Parse AI response
    let aiPredictions;
    try {
      const content = response.content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      aiPredictions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI predictions');
    }

    // Add month names and years
    const currentDate = new Date();
    aiPredictions.predictions.monthly = aiPredictions.predictions.monthly.map((pred, index) => {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + index + 1);
      return {
        ...pred,
        month: futureDate.toLocaleString('default', { month: 'long' }),
        year: futureDate.getFullYear()
      };
    });

    // Store in Pinecone
    let pineconeVectorId = null;
    if (embedding) {
      pineconeVectorId = await storePredictionInPinecone(userId, aiPredictions, embedding);
    }

    // Save to MongoDB with 24-hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const predictionDoc = new Prediction({
      userId,
      predictionType: '3month',
      expiresAt,
      confidence: aiPredictions.confidence || 85,
      dataPointsUsed: metrics.length,
      predictions: aiPredictions.predictions,
      insights: aiPredictions.insights || [],
      risks: aiPredictions.risks || [],
      opportunities: aiPredictions.opportunities || [],
      aiGenerated: true,
      pineconeVectorId,
      historicalSnapshot: {
        startDate,
        endDate,
        avgRevenue: analysis.avgRevenue,
        avgOrders: analysis.avgOrders,
        avgProfit: analysis.avgNetProfit,
        revenueGrowthRate: analysis.revenueGrowth
      }
    });

    await predictionDoc.save();
    console.log('3-month predictions saved to MongoDB');

    return {
      ...predictionDoc.toObject(),
      cached: false
    };

  } catch (error) {
    console.error('3-month prediction error:', error);
    
    // Fallback to statistical predictions if OpenAI fails
    console.log('Using statistical fallback for 3-month predictions');
    
    // Fetch metrics if not already available (in case error happened before fetching)
    let fallbackMetrics = metrics;
    let fallbackAnalysis = analysis;
    
    if (!fallbackMetrics) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);
      
      fallbackMetrics = await DailyMetrics.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
      
      if (fallbackMetrics.length < 30) {
        throw new Error('Insufficient data for predictions');
      }
      
      fallbackAnalysis = await analyzeHistoricalData(fallbackMetrics);
    }
    
    return await generateStatistical3MonthPredictions(userId, fallbackMetrics, fallbackAnalysis);
  }
}

/**
 * Generate statistical 3-month predictions (fallback when OpenAI unavailable)
 */
async function generateStatistical3MonthPredictions(userId, metrics, analysis) {
  try {
    const currentDate = new Date();
    const monthlyPredictions = [];

    // Calculate growth rates
    const revenueGrowthRate = Math.max(analysis.revenueGrowth / 100, 0.05); // Minimum 5% growth
    const ordersGrowthRate = revenueGrowthRate * 0.9; // Orders grow slightly slower
    const profitGrowthRate = revenueGrowthRate * 1.1; // Profit can grow faster with optimization

    // Get most recent 30 days as baseline (current month projection)
    const recentMetrics = metrics.slice(-30); // Last 30 days
    const recentRevenue = recentMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
    const recentOrders = recentMetrics.reduce((sum, m) => sum + (m.totalOrders || 0), 0);
    const recentProfit = recentMetrics.reduce((sum, m) => sum + (m.netProfit || 0), 0);
    const recentAdSpend = recentMetrics.reduce((sum, m) => sum + (m.adSpend || 0), 0);

    // Project to full month if we have less than 30 days
    const daysInMonth = 30;
    const actualDays = recentMetrics.length;
    const projectionFactor = daysInMonth / actualDays;

    // Base values (from most recent month, projected to full month)
    let baseRevenue = recentRevenue * projectionFactor;
    let baseOrders = Math.round(recentOrders * projectionFactor);
    let baseProfit = recentProfit * projectionFactor;
    let baseAdSpend = recentAdSpend * projectionFactor;

    // Historical ROAS (calculated from actual data)
    const historicalROAS = analysis.calculatedROAS || analysis.avgROAS || 10;

    for (let i = 0; i < 3; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i + 1);

      // Apply growth rate with diminishing returns
      const growthFactor = Math.pow(1 + revenueGrowthRate, i + 1);
      const diminishingFactor = 1 - (i * 0.05); // 5% reduction per month

      const monthRevenue = baseRevenue * growthFactor;
      const monthOrders = Math.round(baseOrders * Math.pow(1 + ordersGrowthRate, i + 1));
      const monthProfit = baseProfit * Math.pow(1 + profitGrowthRate, i + 1);
      
      // Ad spend increases with revenue but with better efficiency
      const monthAdSpend = baseAdSpend * growthFactor * 0.9; // 10% better efficiency
      
      // ROAS calculation: Use historical ROAS with slight decline due to scaling
      const monthROAS = historicalROAS * diminishingFactor;
      
      // Profit margin
      const profitMargin = (monthProfit / monthRevenue) * 100;

      monthlyPredictions.push({
        month: futureDate.toLocaleString('default', { month: 'long' }),
        year: futureDate.getFullYear(),
        revenue: Math.round(monthRevenue),
        orders: monthOrders,
        profit: Math.round(monthProfit),
        adSpend: Math.round(monthAdSpend),
        roas: parseFloat(monthROAS.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2))
      });
    }

    // Calculate summary
    const summary = {
      totalRevenue: monthlyPredictions.reduce((sum, m) => sum + m.revenue, 0),
      totalOrders: monthlyPredictions.reduce((sum, m) => sum + m.orders, 0),
      totalProfit: monthlyPredictions.reduce((sum, m) => sum + m.profit, 0),
      avgROAS: monthlyPredictions.reduce((sum, m) => sum + m.roas, 0) / 3,
      avgProfitMargin: monthlyPredictions.reduce((sum, m) => sum + m.profitMargin, 0) / 3
    };

    // Generate insights
    const insights = [
      {
        type: 'positive',
        metric: 'ROAS',
        message: `Historical ROAS of ${historicalROAS.toFixed(2)}x is excellent. Predictions maintain ${summary.avgROAS.toFixed(2)}x average.`,
        recommendation: 'Continue current ad strategies while testing new channels for scale.',
        priority: 'high'
      },
      {
        type: analysis.revenueGrowth > 0 ? 'positive' : 'warning',
        metric: 'Revenue',
        message: `Revenue ${analysis.revenueGrowth > 0 ? 'growing' : 'declining'} at ${Math.abs(analysis.revenueGrowth).toFixed(1)}% rate.`,
        recommendation: analysis.revenueGrowth > 0 ? 'Scale winning products and campaigns.' : 'Review product-market fit and marketing strategies.',
        priority: 'high'
      },
      {
        type: 'positive',
        metric: 'Profit Margin',
        message: `Strong profit margin of ${analysis.profitMargin.toFixed(1)}% indicates healthy business.`,
        recommendation: 'Maintain cost efficiency while investing in growth.',
        priority: 'medium'
      }
    ];

    // Save to MongoDB
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const predictionDoc = new Prediction({
      userId,
      predictionType: '3month',
      expiresAt,
      confidence: 75, // Lower confidence for statistical predictions
      dataPointsUsed: metrics.length,
      predictions: {
        monthly: monthlyPredictions,
        summary
      },
      insights,
      risks: [
        'Market saturation may reduce ROAS over time',
        'Scaling ad spend typically reduces efficiency',
        'Seasonal variations not fully accounted for'
      ],
      opportunities: [
        'Optimize high-performing campaigns for better ROAS',
        'Test new marketing channels',
        'Improve conversion rates to boost profitability'
      ],
      aiGenerated: false, // Statistical fallback
      historicalSnapshot: {
        startDate: metrics[0].date,
        endDate: metrics[metrics.length - 1].date,
        avgRevenue: analysis.avgRevenue,
        avgOrders: analysis.avgOrders,
        avgProfit: analysis.avgNetProfit,
        revenueGrowthRate: analysis.revenueGrowth,
        historicalROAS: historicalROAS
      }
    });

    await predictionDoc.save();
    console.log('Statistical 3-month predictions saved to MongoDB');

    return {
      ...predictionDoc.toObject(),
      cached: false,
      fallback: true
    };

  } catch (error) {
    console.error('Statistical prediction error:', error);
    throw error;
  }
}

/**
 * Get or generate 3-month predictions
 */
async function get3MonthPredictions(userId) {
  try {
    // Try to get cached prediction first
    const cached = await Prediction.getLatestPrediction(userId, '3month');
    if (cached && !await Prediction.needsRefresh(userId, '3month', 24)) {
      console.log('Returning cached 3-month predictions');
      return {
        ...cached.toObject(),
        cached: true,
        loadTime: 'instant'
      };
    }

    // Generate new predictions
    const startTime = Date.now();
    const predictions = await generate3MonthPredictions(userId);
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      ...predictions,
      loadTime: `${loadTime}s`
    };

  } catch (error) {
    console.error('Get 3-month predictions error:', error);
    throw error;
  }
}

module.exports = {
  generate3MonthPredictions,
  get3MonthPredictions
};
