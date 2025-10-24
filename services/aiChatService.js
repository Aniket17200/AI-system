const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
const DailyMetrics = require('../models/DailyMetrics');
const User = require('../models/User');
const logger = require('../config/logger');

class AIChatService {
  constructor() {
    // Initialize OpenAI with error handling
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    this.pinecone = null;
    this.index = null;
    this.metricsCache = new Map(); // Cache for faster responses
    this.initializePinecone();
  }

  async initializePinecone() {
    try {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT
      });
      
      this.index = this.pinecone.index(process.env.PINECONE_INDEX_NAME);
      logger.info('Pinecone initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Pinecone', { error: error.message });
    }
  }

  async chat(userId, message, conversationHistory = []) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured. Please set OPENAI_API_KEY in environment variables.');
      }

      // Get user context (with caching)
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get relevant metrics data (with caching)
      const metricsContext = await this.getRelevantMetricsWithCache(userId, message);
      
      // Build optimized system prompt
      const systemPrompt = this.buildProductionSystemPrompt(user, metricsContext);
      
      // Build messages array (limit history for faster responses)
      const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: message }
      ];

      // Get AI response with optimized settings
      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview', // Fast and accurate
        messages: messages,
        temperature: 0.1, // Very low for precise, factual responses
        max_tokens: 600, // Slightly more for complete answers
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.2
      });

      const responseTime = Date.now() - startTime;
      const aiMessage = response.choices[0].message.content;

      logger.info('AI response generated', { 
        userId, 
        responseTime: `${responseTime}ms`,
        tokens: response.usage.total_tokens 
      });

      return {
        message: aiMessage,
        context: metricsContext.summary,
        responseTime,
        usage: response.usage
      };

    } catch (error) {
      logger.error('AI Chat error', { error: error.message });
      
      // Provide helpful fallback
      if (error.message.includes('OpenAI not configured')) {
        throw error;
      }
      
      throw new Error('Unable to process your question. Please try again.');
    }
  }

  async getRelevantMetrics(userId, query) {
    try {
      // Parse date range from query
      const dateRange = this.parseDateRange(query);
      
      const metrics = await DailyMetrics.find({
        userId,
        date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
      }).sort({ date: -1 });

      if (metrics.length === 0) {
        return { 
          summary: { message: 'No data available for this period' }, 
          metrics: [],
          dateRange: `${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`
        };
      }

      // Calculate summary statistics
      const summary = this.calculateSummary(metrics);
      
      // Get specific data based on query keywords
      const relevantData = this.extractRelevantData(metrics, query);

      return {
        summary,
        relevantData,
        totalDays: metrics.length,
        dateRange: `${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`
      };

    } catch (error) {
      logger.error('Error getting relevant metrics', { error: error.message });
      return { summary: { message: 'Error fetching data' }, metrics: [] };
    }
  }

  parseDateRange(query) {
    const lowerQuery = query.toLowerCase();
    const endDate = new Date();
    let startDate = new Date();

    // Check for specific day counts
    if (lowerQuery.includes('90 days') || lowerQuery.includes('last 90')) {
      startDate.setDate(startDate.getDate() - 90);
    } else if (lowerQuery.includes('60 days') || lowerQuery.includes('last 60')) {
      startDate.setDate(startDate.getDate() - 60);
    } else if (lowerQuery.includes('30 days') || lowerQuery.includes('last 30')) {
      startDate.setDate(startDate.getDate() - 30);
    } else if (lowerQuery.includes('7 days') || lowerQuery.includes('last 7') || lowerQuery.includes('week')) {
      startDate.setDate(startDate.getDate() - 7);
    } else if (lowerQuery.includes('today')) {
      startDate = new Date(endDate);
    } else if (lowerQuery.includes('yesterday')) {
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
    } else {
      // Default to 30 days
      startDate.setDate(startDate.getDate() - 30);
    }

    // Set to start of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  calculateSummary(metrics) {
    const totals = metrics.reduce((acc, m) => ({
      orders: acc.orders + m.totalOrders,
      revenue: acc.revenue + m.revenue,
      cogs: acc.cogs + m.cogs,
      adSpend: acc.adSpend + m.adSpend,
      shippingCost: acc.shippingCost + m.shippingCost,
      grossProfit: acc.grossProfit + m.grossProfit,
      netProfit: acc.netProfit + m.netProfit,
      customers: acc.customers + m.totalCustomers,
      newCustomers: acc.newCustomers + m.newCustomers
    }), {
      orders: 0, revenue: 0, cogs: 0, adSpend: 0, shippingCost: 0,
      grossProfit: 0, netProfit: 0, customers: 0, newCustomers: 0
    });

    return {
      totalOrders: totals.orders,
      totalRevenue: totals.revenue,
      totalCOGS: totals.cogs,
      totalAdSpend: totals.adSpend,
      totalShippingCost: totals.shippingCost,
      totalGrossProfit: totals.grossProfit,
      totalNetProfit: totals.netProfit,
      grossProfitMargin: totals.revenue > 0 ? (totals.grossProfit / totals.revenue * 100).toFixed(2) : 0,
      netProfitMargin: totals.revenue > 0 ? (totals.netProfit / totals.revenue * 100).toFixed(2) : 0,
      roas: totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0,
      poas: totals.adSpend > 0 ? (totals.netProfit / totals.adSpend).toFixed(2) : 0,
      aov: totals.orders > 0 ? (totals.revenue / totals.orders).toFixed(2) : 0,
      totalCustomers: totals.customers,
      newCustomers: totals.newCustomers,
      returningCustomers: totals.customers - totals.newCustomers
    };
  }

  extractRelevantData(metrics, query) {
    const lowerQuery = query.toLowerCase();
    const data = {};

    // Always include summary for context
    data.summary = this.calculateSummary(metrics);

    // Marketing/Ads related
    if (lowerQuery.includes('roas') || lowerQuery.includes('ad') || lowerQuery.includes('marketing') || 
        lowerQuery.includes('cpm') || lowerQuery.includes('ctr') || lowerQuery.includes('cpc') ||
        lowerQuery.includes('cpp') || lowerQuery.includes('cost per purchase') || lowerQuery.includes('spend')) {
      data.marketing = metrics.map(m => ({
        date: m.date.toISOString().split('T')[0],
        adSpend: m.adSpend,
        roas: m.roas,
        poas: m.poas,
        cpp: m.cpp,
        cpc: m.cpc,
        ctr: m.ctr,
        cpm: m.cpm,
        reach: m.reach,
        impressions: m.impressions,
        clicks: m.linkClicks
      }));
    }

    // Sales/Revenue/Orders related
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue') || lowerQuery.includes('order') ||
        lowerQuery.includes('aov') || lowerQuery.includes('average order')) {
      data.sales = metrics.map(m => ({
        date: m.date.toISOString().split('T')[0],
        revenue: m.revenue,
        orders: m.totalOrders,
        aov: m.aov
      }));
    }

    // Customer related
    if (lowerQuery.includes('customer') || lowerQuery.includes('retention') || lowerQuery.includes('returning')) {
      data.customers = metrics.map(m => ({
        date: m.date.toISOString().split('T')[0],
        total: m.totalCustomers,
        new: m.newCustomers,
        returning: m.returningCustomers,
        returningRate: m.returningRate
      }));
    }

    // Shipping/Delivery related
    if (lowerQuery.includes('shipping') || lowerQuery.includes('delivery') || lowerQuery.includes('rto') ||
        lowerQuery.includes('shipment') || lowerQuery.includes('ndr') || lowerQuery.includes('courier')) {
      data.shipping = metrics.map(m => ({
        date: m.date.toISOString().split('T')[0],
        totalShipments: m.totalShipments,
        delivered: m.delivered,
        inTransit: m.inTransit,
        rto: m.rto,
        ndr: m.ndr,
        deliveryRate: m.deliveryRate,
        rtoRate: m.rtoRate,
        shippingCost: m.shippingCost
      }));
    }

    // Profit/Financial related
    if (lowerQuery.includes('profit') || lowerQuery.includes('margin') || lowerQuery.includes('poas') ||
        lowerQuery.includes('gross') || lowerQuery.includes('net') || lowerQuery.includes('financial')) {
      data.financial = metrics.map(m => ({
        date: m.date.toISOString().split('T')[0],
        revenue: m.revenue,
        cogs: m.cogs,
        grossProfit: m.grossProfit,
        grossMargin: m.grossProfitMargin,
        netProfit: m.netProfit,
        netMargin: m.netProfitMargin,
        poas: m.poas
      }));
    }

    return data;
  }

  buildSystemPrompt(user, metricsContext) {
    return `You are an AI business analytics assistant for ProfitFirst, helping ${user.email} analyze their e-commerce business data.

CURRENT BUSINESS METRICS (Last 30 Days):
- Total Orders: ${metricsContext.summary.totalOrders}
- Total Revenue: ₹${metricsContext.summary.totalRevenue?.toLocaleString('en-IN')}
- Gross Profit: ₹${metricsContext.summary.totalGrossProfit?.toLocaleString('en-IN')} (${metricsContext.summary.grossProfitMargin}%)
- Net Profit: ₹${metricsContext.summary.totalNetProfit?.toLocaleString('en-IN')} (${metricsContext.summary.netProfitMargin}%)
- ROAS: ${metricsContext.summary.roas}x
- POAS: ${metricsContext.summary.poas}x
- Average Order Value: ₹${metricsContext.summary.aov}
- Total Customers: ${metricsContext.summary.totalCustomers}
- New Customers: ${metricsContext.summary.newCustomers}
- Returning Customers: ${metricsContext.summary.returningCustomers}

YOUR ROLE:
- Provide clear, actionable insights about their business performance
- Answer questions about revenue, profit, marketing, customers, and trends
- Suggest improvements and identify opportunities
- Use the actual data provided above in your responses
- Be conversational but professional
- Format numbers with Indian Rupee (₹) symbol
- Provide specific numbers and percentages when relevant

GUIDELINES:
- Always base answers on the actual metrics data provided
- If asked about data not available, politely explain what data you have
- Provide context and comparisons when helpful
- Suggest actionable next steps when appropriate
- Keep responses concise but informative`;
  }

  async indexMetricsData(userId) {
    try {
      if (!this.index) {
        logger.warn('Pinecone not initialized, skipping indexing');
        return;
      }

      const metrics = await DailyMetrics.find({ userId }).sort({ date: -1 }).limit(90);
      
      const vectors = [];
      for (const metric of metrics) {
        const text = this.metricToText(metric);
        const embedding = await this.createEmbedding(text);
        
        vectors.push({
          id: `${userId}_${metric.date.toISOString()}`,
          values: embedding,
          metadata: {
            userId: userId.toString(),
            date: metric.date.toISOString(),
            revenue: metric.revenue,
            netProfit: metric.netProfit,
            orders: metric.totalOrders
          }
        });
      }

      if (vectors.length > 0) {
        await this.index.upsert(vectors);
        logger.info(`Indexed ${vectors.length} metrics for user ${userId}`);
      }

    } catch (error) {
      logger.error('Error indexing metrics', { error: error.message });
    }
  }

  metricToText(metric) {
    return `Date: ${metric.date.toISOString().split('T')[0]}. 
    Orders: ${metric.totalOrders}. 
    Revenue: ₹${metric.revenue}. 
    Net Profit: ₹${metric.netProfit} (${metric.netProfitMargin}% margin). 
    ROAS: ${metric.roas}x. 
    Customers: ${metric.totalCustomers} (${metric.newCustomers} new, ${metric.returningCustomers} returning).`;
  }

  async createEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error creating embedding', { error: error.message });
      throw error;
    }
  }
  async getRelevantMetricsWithCache(userId, query) {
    const cacheKey = `${userId}_metrics`;
    const cached = this.metricsCache.get(cacheKey);
    
    // Use cache if less than 5 minutes old
    if (cached && (Date.now() - cached.timestamp < 300000)) {
      return cached.data;
    }
    
    const data = await this.getRelevantMetrics(userId, query);
    this.metricsCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }

  buildProductionSystemPrompt(user, metricsContext) {
    const summary = metricsContext.summary;
    const dateRange = metricsContext.dateRange || 'Last 30 days';
    const totalDays = metricsContext.totalDays || 30;
    
    return `You are an expert e-commerce business analyst for ${user.email}'s store.

IMPORTANT: You have access to ${totalDays} days of complete historical data covering the period: ${dateRange}

COMPLETE METRICS FOR THIS PERIOD:
📊 SALES: Orders: ${summary.totalOrders} | Revenue: ₹${this.formatNumber(summary.totalRevenue)} | AOV: ₹${this.formatNumber(summary.aov)}
💰 PROFIT: Gross: ₹${this.formatNumber(summary.totalGrossProfit)} (${summary.grossProfitMargin}%) | Net: ₹${this.formatNumber(summary.totalNetProfit)} (${summary.netProfitMargin}%)
📢 MARKETING: Ad Spend: ₹${this.formatNumber(summary.totalAdSpend)} | ROAS: ${summary.roas}x | POAS: ${summary.poas}x | CPP: ₹${this.formatNumber(summary.totalAdSpend / summary.totalOrders || 0)}
👥 CUSTOMERS: Total: ${summary.totalCustomers} | New: ${summary.newCustomers} | Returning: ${summary.returningCustomers} | Returning Rate: ${summary.returningRate || 0}%
🚚 SHIPPING: Cost: ₹${this.formatNumber(summary.totalShippingCost)} | Avg per Order: ₹${this.formatNumber(summary.totalShippingCost / summary.totalOrders || 0)}

CRITICAL INSTRUCTIONS:
1. ALWAYS use the exact numbers from the metrics above
2. NEVER say "data is not available" if the metric is shown above
3. When asked about a time period (30/60/90 days), use the data for that EXACT period
4. Format all currency as ₹X,XXX (Indian Rupees with commas)
5. Format percentages with 2 decimal places (e.g., 59.84%)
6. Format multipliers with 2 decimal places (e.g., 10.24x)

RESPONSE RULES:
✅ For "What is my revenue?" → "Your revenue in [period] is ₹[exact amount]."
✅ For "What is my ROAS?" → "Your ROAS in [period] is [X.XX]x."
✅ For "How many orders?" → "You had [exact number] orders in [period]."
✅ For "What is my profit?" → "Your net profit in [period] is ₹[amount] with a margin of [X.XX]%."
✅ For "Cost per purchase?" → "Your cost per purchase in [period] is ₹[amount]."
✅ For comparisons → Calculate and show both periods with growth/decline percentage

ANSWER FORMAT:
- Start with the direct answer to the question
- Include the specific time period mentioned
- Add 1 brief insight or context if helpful (optional)
- Keep total response under 3 sentences
- Be confident and precise - you HAVE the data!

EXAMPLES:
Q: "What is my ROAS in last 30 days?"
A: "Your ROAS in the last 30 days is 10.24x."

Q: "What is my revenue in last 60 days?"
A: "Your total revenue in the last 60 days is ₹8,45,230."

Q: "What is my net profit and margin?"
A: "Your net profit in the last 30 days is ₹2,53,138 with a net margin of 59.84%."

Remember: You have complete data for ${totalDays} days. Answer confidently with exact numbers!`;
  }

  formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
}

module.exports = new AIChatService();
