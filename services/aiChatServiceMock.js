const DailyMetrics = require('../models/DailyMetrics');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Mock AI Chat Service - Returns calculated answers without OpenAI
 * Use this when OpenAI quota is exhausted or for testing
 */
class AIChatServiceMock {
  async chat(userId, message) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Parse date range from query
      const dateRange = this.parseDateRange(message);
      
      // Get metrics
      const metrics = await DailyMetrics.find({
        userId,
        date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
      }).sort({ date: -1 });

      if (metrics.length === 0) {
        return {
          message: `No data available for the requested period (${dateRange.days} days).`,
          context: { noData: true }
        };
      }

      // Calculate summary
      const summary = this.calculateSummary(metrics);
      
      // Generate answer based on question type
      const answer = this.generateAnswer(message, summary, dateRange.days, dateRange.dateLabel);

      logger.info('Mock AI response generated', { userId, days: dateRange.days, dateLabel: dateRange.dateLabel });

      return {
        message: answer,
        context: summary,
        mock: true
      };

    } catch (error) {
      logger.error('Mock AI Chat error', { error: error.message });
      throw new Error('Unable to process your question. Please try again.');
    }
  }

  parseDateRange(query) {
    const lowerQuery = query.toLowerCase();
    const now = new Date();
    let endDate = new Date();
    let startDate = new Date();
    let days = 30;
    let dateLabel = 'last 30 days';

    // Check for specific dates (e.g., "2 October", "October 2", "2nd October")
    const specificDatePatterns = [
      /(\d{1,2})(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th)?/i,
      /(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{2,4}))?/,
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
          if (match[3] && monthNames[match[3].toLowerCase()] !== undefined) {
            day = parseInt(match[1]);
            month = monthNames[match[3].toLowerCase()];
          } else if (match[1] && monthNames[match[1].toLowerCase()] !== undefined) {
            month = monthNames[match[1].toLowerCase()];
            day = parseInt(match[2]);
          }
          year = now.getFullYear();
          const testDate = new Date(year, month, day);
          if (testDate > now) year--;
        } else if (match[0].includes('-') && match[1].length === 4) {
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        } else {
          day = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          year = match[4] ? (match[4].length === 2 ? 2000 + parseInt(match[4]) : parseInt(match[4])) : now.getFullYear();
          const testDate = new Date(year, month, day);
          if (testDate > now) year--;
        }

        if (day && month !== undefined && year) {
          startDate = new Date(year, month, day, 0, 0, 0, 0);
          endDate = new Date(year, month, day, 23, 59, 59, 999);
          days = 1;
          dateLabel = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          logger.info('Mock: Parsed specific date', { query, date: startDate.toISOString().split('T')[0] });
          return { startDate, endDate, days, dateLabel };
        }
      }
    }

    // Check for relative dates
    if (lowerQuery.includes('today')) {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      days = 1;
      dateLabel = 'today';
    } else if (lowerQuery.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      days = 1;
      dateLabel = 'yesterday';
    } else if (lowerQuery.includes('this week')) {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      days = dayOfWeek + 1;
      dateLabel = 'this week';
    } else if (lowerQuery.includes('last week')) {
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(now.getDate() - dayOfWeek - 1);
      endDate.setHours(23, 59, 59, 999);
      days = 7;
      dateLabel = 'last week';
    } else if (lowerQuery.includes('this month')) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      days = now.getDate();
      dateLabel = 'this month';
    } else if (lowerQuery.includes('last month')) {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      days = endDate.getDate();
      dateLabel = 'last month';
    } else if (lowerQuery.includes('90 days') || lowerQuery.includes('last 90')) {
      days = 90;
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      dateLabel = 'last 90 days';
    } else if (lowerQuery.includes('60 days') || lowerQuery.includes('last 60')) {
      days = 60;
      startDate.setDate(startDate.getDate() - 60);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      dateLabel = 'last 60 days';
    } else if (lowerQuery.includes('30 days') || lowerQuery.includes('last 30')) {
      days = 30;
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      dateLabel = 'last 30 days';
    } else if (lowerQuery.includes('7 days') || lowerQuery.includes('last 7') || lowerQuery.includes('week')) {
      days = 7;
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      dateLabel = 'last 7 days';
    } else {
      // Default to 30 days
      days = 30;
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      dateLabel = 'last 30 days';
    }

    return { startDate, endDate, days, dateLabel };
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
      reach: acc.reach + (m.reach || 0),
      codCollected: acc.codCollected + (m.codCollected || 0)
    }), {
      orders: 0, revenue: 0, cogs: 0, adSpend: 0, shippingCost: 0,
      grossProfit: 0, netProfit: 0, customers: 0, newCustomers: 0,
      totalShipments: 0, delivered: 0, inTransit: 0, rto: 0, ndr: 0,
      impressions: 0, linkClicks: 0, reach: 0, codCollected: 0
    });

    return {
      totalOrders: totals.orders,
      totalRevenue: totals.revenue,
      totalAdSpend: totals.adSpend,
      totalShippingCost: totals.shippingCost,
      totalGrossProfit: totals.grossProfit,
      totalNetProfit: totals.netProfit,
      grossProfitMargin: totals.revenue > 0 ? (totals.grossProfit / totals.revenue * 100) : 0,
      netProfitMargin: totals.revenue > 0 ? (totals.netProfit / totals.revenue * 100) : 0,
      roas: totals.adSpend > 0 ? (totals.revenue / totals.adSpend) : 0,
      poas: totals.adSpend > 0 ? (totals.netProfit / totals.adSpend) : 0,
      aov: totals.orders > 0 ? (totals.revenue / totals.orders) : 0,
      cpp: totals.orders > 0 && totals.adSpend > 0 ? (totals.adSpend / totals.orders) : 0,
      cpc: totals.linkClicks > 0 ? (totals.adSpend / totals.linkClicks) : 0,
      ctr: totals.impressions > 0 ? ((totals.linkClicks / totals.impressions) * 100) : 0,
      cpm: totals.impressions > 0 ? ((totals.adSpend / totals.impressions) * 1000) : 0,
      totalCustomers: totals.customers,
      newCustomers: totals.newCustomers,
      returningCustomers: totals.customers - totals.newCustomers,
      returningRate: totals.customers > 0 ? ((totals.customers - totals.newCustomers) / totals.customers * 100) : 0,
      totalShipments: totals.totalShipments,
      delivered: totals.delivered,
      inTransit: totals.inTransit,
      rto: totals.rto,
      ndr: totals.ndr,
      deliveryRate: totals.totalShipments > 0 ? ((totals.delivered / totals.totalShipments) * 100) : 0,
      rtoRate: totals.totalShipments > 0 ? ((totals.rto / totals.totalShipments) * 100) : 0,
      codCollected: totals.codCollected
    };
  }

  generateAnswer(query, summary, days, dateLabel) {
    const q = query.toLowerCase();
    const fmt = (num) => num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const period = dateLabel || `last ${days} days`;
    const preposition = (period === 'today' || period === 'yesterday' || days === 1) ? 'on' : 'in the';
    
    // Calculate daily averages
    const dailyRevenue = summary.totalRevenue / days;
    const dailyOrders = summary.totalOrders / days;

    // ROAS with context
    if (q.includes('roas')) {
      const roasQuality = summary.roas > 8 ? 'exceptional - well above the industry average of 4-5x' : 
                          summary.roas > 4 ? 'strong and above industry average' :
                          summary.roas > 2 ? 'good but has room for optimization' :
                          'below industry standards and needs improvement';
      return `Your ROAS ${preposition} ${period} is ${summary.roas.toFixed(2)}x, which is ${roasQuality}.`;
    }

    // POAS
    if (q.includes('poas')) {
      return `Your POAS ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ${summary.poas.toFixed(2)}x.`;
    }

    // Revenue/Sales with context
    if (q.includes('revenue') || q.includes('sales') || q.includes('total sales')) {
      if (days === 1) {
        return `Your revenue ${preposition} ${period} is ₹${fmt(summary.totalRevenue)}.`;
      }
      return `Your revenue ${preposition} ${period} is ₹${fmt(summary.totalRevenue)}, averaging ₹${fmt(dailyRevenue)} per day with consistent performance.`;
    }

    // Orders with context
    if (q.includes('orders') || q.includes('how many order')) {
      if (days === 1) {
        return `You had ${summary.totalOrders} order${summary.totalOrders !== 1 ? 's' : ''} ${preposition} ${period}.`;
      }
      return `You had ${summary.totalOrders} orders ${preposition} ${period}, averaging ${Math.round(dailyOrders)} orders per day.`;
    }

    // Ad Spend
    if (q.includes('spend on ads') || q.includes('ad spend')) {
      return `You spent ₹${fmt(summary.totalAdSpend)} on ads ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period}.`;
    }

    // Cost per purchase/sale
    if (q.includes('cost per purchase') || q.includes('cost per sale') || q.includes('cpp')) {
      return `Your cost per purchase ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(summary.cpp)}.`;
    }

    // CPC
    if (q.includes('cpc') || q.includes('cost per click')) {
      return `Your cost per click (CPC) ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(summary.cpc)}.`;
    }

    // CTR
    if (q.includes('ctr') || q.includes('click through rate')) {
      return `Your click-through rate (CTR) ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ${summary.ctr.toFixed(2)}%.`;
    }

    // CPM
    if (q.includes('cpm') || q.includes('cost per thousand')) {
      return `Your cost per thousand impressions (CPM) ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(summary.cpm)}.`;
    }

    // AOV
    if (q.includes('average order value') || q.includes('aov')) {
      return `Your average order value ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(summary.aov)}.`;
    }

    // Profit with context
    if (q.includes('net profit') && q.includes('margin')) {
      const marginQuality = summary.netProfitMargin > 40 ? 'excellent for e-commerce (industry average: 10-20%)' :
                           summary.netProfitMargin > 25 ? 'healthy and above industry average' :
                           summary.netProfitMargin > 15 ? 'moderate, in line with industry standards' :
                           'below industry average and needs optimization';
      return `Your net profit ${preposition} ${period} is ₹${fmt(summary.totalNetProfit)} with a ${summary.netProfitMargin.toFixed(1)}% margin, which is ${marginQuality}.`;
    }
    if (q.includes('net profit')) {
      return `Your net profit ${preposition} ${period} is ₹${fmt(summary.totalNetProfit)} (${summary.netProfitMargin.toFixed(1)}% margin).`;
    }
    if (q.includes('gross profit') && q.includes('margin')) {
      return `Your gross profit ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(summary.totalGrossProfit)} with a gross margin of ${summary.grossProfitMargin.toFixed(2)}%.`;
    }
    if (q.includes('gross profit')) {
      return `Your gross profit ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(summary.totalGrossProfit)}.`;
    }

    // Customers
    if (q.includes('returning customer rate')) {
      return `Your returning customer rate ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ${summary.returningRate.toFixed(2)}%.`;
    }

    // Shipping with context
    if (q.includes('delivery rate')) {
      const deliveryQuality = summary.deliveryRate > 92 ? 'excellent (above 92% benchmark)' :
                             summary.deliveryRate > 85 ? 'good but has room for improvement (industry benchmark: 90-95%)' :
                             'below industry standards and needs immediate attention';
      return `Your delivery rate ${preposition} ${period} is ${summary.deliveryRate.toFixed(1)}%, which is ${deliveryQuality}.`;
    }
    if (q.includes('rto rate')) {
      const rtoQuality = summary.rtoRate < 3 ? 'excellent (below 3% benchmark)' :
                        summary.rtoRate < 5 ? 'acceptable but can be optimized' :
                        'high and impacting profitability - needs immediate action';
      return `Your RTO rate ${preposition} ${period} is ${summary.rtoRate.toFixed(1)}%, which is ${rtoQuality}.`;
    }
    if (q.includes('shipments')) {
      return `You had ${summary.totalShipments} shipments ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period}.`;
    }
    if (q.includes('in-transit') || q.includes('in transit')) {
      return `You have ${summary.inTransit} orders currently in-transit.`;
    }
    if (q.includes('ndr pending')) {
      return `You have ${summary.ndr} NDR (Non-Delivery Report) pending orders.`;
    }
    if (q.includes('shipping spend') || q.includes('shipping cost')) {
      return `Your shipping spend ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(summary.totalShippingCost)}.`;
    }
    if (q.includes('average shipping cost')) {
      const avgShipping = summary.totalOrders > 0 ? summary.totalShippingCost / summary.totalOrders : 0;
      return `Your average shipping cost per order ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period} is ₹${fmt(avgShipping)}.`;
    }
    if (q.includes('cod amount') || q.includes('cod collected')) {
      return `You received ₹${fmt(summary.codCollected)} in COD amount ${period === 'today' || period === 'yesterday' || days === 1 ? 'on' : 'in the'} ${period}.`;
    }

    // Profit margin query
    if (q.includes('profit margin') || q.includes('margin')) {
      const marginQuality = summary.netProfitMargin > 40 ? 'excellent for e-commerce (industry average: 10-20%)' :
                           summary.netProfitMargin > 25 ? 'healthy and above industry average' :
                           'moderate, in line with industry standards';
      return `Your net profit margin ${preposition} ${period} is ${summary.netProfitMargin.toFixed(1)}%, which is ${marginQuality}.`;
    }

    // AOV query
    if (q.includes('aov') || q.includes('average order value')) {
      return `Your average order value ${preposition} ${period} is ₹${fmt(summary.aov)}.`;
    }

    // Customer retention
    if (q.includes('retention') || q.includes('returning customer')) {
      const retentionRate = summary.totalCustomers > 0 ? ((summary.returningCustomers / summary.totalCustomers) * 100).toFixed(1) : 0;
      const retentionQuality = retentionRate > 30 ? 'strong and indicates good customer satisfaction' :
                              retentionRate > 15 ? 'moderate with room for improvement' :
                              'low and needs attention through loyalty programs';
      return `Your returning customer rate ${preposition} ${period} is ${retentionRate}%, which is ${retentionQuality}.`;
    }

    // Default response - comprehensive summary
    return `${period === 'today' || period === 'yesterday' || days === 1 ? 'On' : 'In the'} ${period}: Revenue ₹${fmt(summary.totalRevenue)}, ${summary.totalOrders} orders, Net Profit ₹${fmt(summary.totalNetProfit)} (${summary.netProfitMargin.toFixed(1)}% margin), ROAS ${summary.roas.toFixed(2)}x.`;
  }
}

module.exports = new AIChatServiceMock();
