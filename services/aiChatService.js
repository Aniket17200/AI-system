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

      // Get AI response with speed-optimized settings
      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Fast and cost-effective
        messages: messages,
        temperature: 0.2, // Lower for faster, more consistent responses
        max_tokens: 350, // Reduced for faster responses while maintaining quality
        top_p: 0.9, // Slightly lower for more focused responses
        frequency_penalty: 0.2,
        presence_penalty: 0.2,
        stream: false // Ensure non-streaming for predictable timing
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
      
      // Re-throw the original error so the router can handle it properly
      throw error;
    }
  }

  async getRelevantMetrics(userId, query) {
    try {
      // Parse date range from query
      const dateRange = this.parseDateRange(query);
      
      // Optimized query: only select fields we need for faster retrieval
      const metrics = await DailyMetrics.find({
        userId,
        date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
      })
      .select('date totalOrders revenue cogs adSpend shippingCost grossProfit netProfit totalCustomers newCustomers returningCustomers totalShipments delivered inTransit rto ndr impressions linkClicks reach roas poas aov cpp cpc ctr cpm grossProfitMargin netProfitMargin deliveryRate rtoRate returningRate')
      .sort({ date: -1 })
      .lean(); // Use lean() for faster queries (returns plain JS objects)

      if (metrics.length === 0) {
        return { 
          summary: { 
            totalOrders: 0,
            totalRevenue: 0,
            totalNetProfit: 0,
            netProfitMargin: 0,
            roas: 0,
            totalAdSpend: 0,
            aov: 0,
            totalCustomers: 0,
            newCustomers: 0,
            returningCustomers: 0,
            totalShipments: 0,
            delivered: 0,
            rto: 0,
            deliveryRate: 0,
            rtoRate: 0,
            message: 'No data available for this period'
          }, 
          metrics: [],
          totalDays: 0,
          dateRange: `${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`
        };
      }

      // Calculate summary statistics
      const summary = this.calculateSummary(metrics);
      
      // Skip extractRelevantData for faster responses - summary is enough
      // const relevantData = this.extractRelevantData(metrics, query);

      return {
        summary,
        // relevantData, // Removed to reduce response time
        totalDays: metrics.length,
        dateRange: `${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`
      };

    } catch (error) {
      logger.error('Error getting relevant metrics', { error: error.message });
      return { 
        summary: { 
          totalOrders: 0,
          totalRevenue: 0,
          message: 'Error fetching data' 
        }, 
        metrics: [],
        totalDays: 0
      };
    }
  }

  parseDateRange(query) {
    const lowerQuery = query.toLowerCase();
    const now = new Date();
    let endDate = new Date();
    let startDate = new Date();

    // Check for specific dates (e.g., "2 October", "October 2", "2nd October")
    const specificDatePatterns = [
      // "2 October", "2 october", "2nd October"
      /(\d{1,2})(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      // "October 2", "october 2"
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th)?/i,
      // "2/10", "2-10", "02/10/2025"
      /(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{2,4}))?/,
      // "2025-10-02" (ISO format)
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
    ];

    const monthNames = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };

    // Try to match specific date patterns
    for (const pattern of specificDatePatterns) {
      const match = query.match(pattern);
      if (match) {
        let day, month, year;

        if (pattern.source.includes('january|february')) {
          // Pattern 1 or 2: "2 October" or "October 2"
          if (match[3] && monthNames[match[3].toLowerCase()] !== undefined) {
            // "2 October" format
            day = parseInt(match[1]);
            month = monthNames[match[3].toLowerCase()];
          } else if (match[1] && monthNames[match[1].toLowerCase()] !== undefined) {
            // "October 2" format
            month = monthNames[match[1].toLowerCase()];
            day = parseInt(match[2]);
          }
          year = now.getFullYear();
          
          // If the date is in the future, assume previous year
          const testDate = new Date(year, month, day);
          if (testDate > now) {
            year--;
          }
        } else if (match[0].includes('-') && match[1].length === 4) {
          // ISO format: "2025-10-02"
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        } else {
          // "2/10" or "2-10" format (assume day/month)
          day = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          year = match[4] ? (match[4].length === 2 ? 2000 + parseInt(match[4]) : parseInt(match[4])) : now.getFullYear();
          
          // If the date is in the future, assume previous year
          const testDate = new Date(year, month, day);
          if (testDate > now) {
            year--;
          }
        }

        if (day && month !== undefined && year) {
          startDate = new Date(year, month, day, 0, 0, 0, 0);
          endDate = new Date(year, month, day, 23, 59, 59, 999);
          logger.info('Parsed specific date', { 
            query, 
            date: startDate.toISOString().split('T')[0] 
          });
          return { startDate, endDate };
        }
      }
    }

    // Check for relative dates
    if (lowerQuery.includes('today')) {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (lowerQuery.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    } else if (lowerQuery.includes('this week')) {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('last week')) {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(now.getDate() - dayOfWeek - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('this month')) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('last month')) {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (lowerQuery.includes('90 days') || lowerQuery.includes('last 90')) {
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('60 days') || lowerQuery.includes('last 60')) {
      startDate.setDate(startDate.getDate() - 60);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('30 days') || lowerQuery.includes('last 30')) {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (lowerQuery.includes('7 days') || lowerQuery.includes('last 7') || lowerQuery.includes('week')) {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to 30 days
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

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
      newCustomers: acc.newCustomers + m.newCustomers,
      totalShipments: acc.totalShipments + (m.totalShipments || 0),
      delivered: acc.delivered + (m.delivered || 0),
      inTransit: acc.inTransit + (m.inTransit || 0),
      rto: acc.rto + (m.rto || 0),
      ndr: acc.ndr + (m.ndr || 0),
      impressions: acc.impressions + (m.impressions || 0),
      linkClicks: acc.linkClicks + (m.linkClicks || 0),
      reach: acc.reach + (m.reach || 0)
    }), {
      orders: 0, revenue: 0, cogs: 0, adSpend: 0, shippingCost: 0,
      grossProfit: 0, netProfit: 0, customers: 0, newCustomers: 0,
      totalShipments: 0, delivered: 0, inTransit: 0, rto: 0, ndr: 0,
      impressions: 0, linkClicks: 0, reach: 0
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
      cpp: totals.orders > 0 && totals.adSpend > 0 ? (totals.adSpend / totals.orders).toFixed(2) : 0,
      cpc: totals.linkClicks > 0 ? (totals.adSpend / totals.linkClicks).toFixed(2) : 0,
      ctr: totals.impressions > 0 ? ((totals.linkClicks / totals.impressions) * 100).toFixed(2) : 0,
      cpm: totals.impressions > 0 ? ((totals.adSpend / totals.impressions) * 1000).toFixed(2) : 0,
      totalCustomers: totals.customers,
      newCustomers: totals.newCustomers,
      returningCustomers: totals.customers - totals.newCustomers,
      returningRate: totals.customers > 0 ? ((totals.customers - totals.newCustomers) / totals.customers * 100).toFixed(2) : 0,
      totalShipments: totals.totalShipments,
      delivered: totals.delivered,
      inTransit: totals.inTransit,
      rto: totals.rto,
      ndr: totals.ndr,
      deliveryRate: totals.totalShipments > 0 ? ((totals.delivered / totals.totalShipments) * 100).toFixed(2) : 0,
      rtoRate: totals.totalShipments > 0 ? ((totals.rto / totals.totalShipments) * 100).toFixed(2) : 0,
      totalImpressions: totals.impressions,
      totalClicks: totals.linkClicks,
      totalReach: totals.reach
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
    // Create cache key based on user and date range for more accurate caching
    const dateRange = this.parseDateRange(query);
    const cacheKey = `${userId}_${dateRange.startDate.toISOString().split('T')[0]}_${dateRange.endDate.toISOString().split('T')[0]}`;
    const cached = this.metricsCache.get(cacheKey);
    
    // Use cache if less than 5 minutes old (balance between speed and freshness)
    if (cached && (Date.now() - cached.timestamp < 300000)) {
      logger.info('Using cached metrics', { userId, cacheAge: `${Math.round((Date.now() - cached.timestamp) / 1000)}s` });
      return cached.data;
    }
    
    // Fetch fresh data from MongoDB with optimized query
    const data = await this.getRelevantMetrics(userId, query);
    
    // Cache the result
    this.metricsCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries (keep only last 10)
    if (this.metricsCache.size > 10) {
      const firstKey = this.metricsCache.keys().next().value;
      this.metricsCache.delete(firstKey);
    }
    
    logger.info('Fetched fresh metrics from database', { userId, dateRange: data.dateRange });
    
    return data;
  }

  buildProductionSystemPrompt(user, metricsContext) {
    const summary = metricsContext.summary;
    const dateRange = metricsContext.dateRange || 'Last 30 days';
    const totalDays = metricsContext.totalDays || 30;
    const dailyAvgOrders = Math.round(summary.totalOrders / totalDays);
    const dailyAvgRevenue = Math.round(summary.totalRevenue / totalDays);
    
    // Format date range for better context
    const dateRangeDisplay = dateRange.includes('to') 
      ? dateRange 
      : `${dateRange} (${totalDays} day${totalDays > 1 ? 's' : ''})`;
    
    // Calculate performance indicators
    const roasPerformance = summary.roas > 8 ? 'exceptional' : summary.roas > 4 ? 'strong' : summary.roas > 2 ? 'good' : 'needs improvement';
    const marginPerformance = summary.netProfitMargin > 40 ? 'excellent' : summary.netProfitMargin > 25 ? 'healthy' : summary.netProfitMargin > 15 ? 'moderate' : 'low';
    const returningRate = summary.totalCustomers > 0 ? ((summary.returningCustomers / summary.totalCustomers) * 100).toFixed(1) : 0;
    
    return `You are a friendly e-commerce analyst helping ${user.email}. Period: ${dateRangeDisplay}

DATA (${totalDays} days):
Revenue: ₹${this.formatNumber(summary.totalRevenue)} | Orders: ${summary.totalOrders} (${dailyAvgOrders}/day) | Profit: ₹${this.formatNumber(summary.totalNetProfit)} (${parseFloat(summary.netProfitMargin || 0).toFixed(1)}%)
ROAS: ${parseFloat(summary.roas || 0).toFixed(2)}x | Ad Spend: ₹${this.formatNumber(summary.totalAdSpend)} | AOV: ₹${this.formatNumber(summary.aov)}
Customers: ${summary.totalCustomers} (${summary.newCustomers} new) | Delivery: ${parseFloat(summary.deliveryRate || 0).toFixed(1)}% | RTO: ${parseFloat(summary.rtoRate || 0).toFixed(1)}%

STYLE: Conversational, specific, insightful. Use exact numbers with context.

❌ BAD: "Revenue ₹58,34,724, 3591 orders, Net Profit ₹20,56,595 (35.2% margin), ROAS 4.91x"
✅ GOOD: "You've had a strong month! Revenue hit ₹58,34,724 from 3,591 orders (120/day). Profit is ₹20,56,595 with a healthy 35.2% margin - well above the 10-20% average. ROAS of 4.91x is solid, meaning every ₹1 in ads brings ₹4.91 revenue."

RULES:
1. Start conversationally: "You've had...", "Looking at..."
2. Use exact numbers: ₹58,34,724 not "~₹58 lakhs"
3. Add context: Compare to benchmarks (ROAS 4-5x good, 8x+ excellent | Margin 10-20% avg, 30%+ excellent | Delivery 90-95% good | RTO <3% excellent)
4. Explain meaning: "meaning every ₹1 spent brings ₹X"
5. Keep concise: 2-4 sentences for specific questions, 4-6 for general

EXAMPLES:
Q: "Last 30 days?" → "Strong month! Revenue ₹58.3L from 3,591 orders (120/day). Profit ₹20.6L at 35.2% margin (excellent vs 10-20% avg). ROAS 4.91x is solid."
Q: "My ROAS?" → "Your ROAS is 4.91x, solid and above the 4x benchmark. Every ₹1 in ads generates ₹4.91 revenue."
Q: "Orders?" → "You had 3,591 orders, averaging 120/day. Healthy volume for your business."

Be helpful, accurate, and conversational!`;
  }

  formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  // Clear cache for a specific user or all users
  clearCache(userId = null) {
    if (userId) {
      const cacheKey = `${userId}_metrics`;
      this.metricsCache.delete(cacheKey);
      logger.info('Cache cleared for user', { userId });
    } else {
      this.metricsCache.clear();
      logger.info('All cache cleared');
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.metricsCache.size,
      keys: Array.from(this.metricsCache.keys())
    };
  }
}

module.exports = new AIChatService();
