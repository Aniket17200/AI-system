const ShopifyService = require('./shopifyService');
const MetaAdsService = require('./metaAdsService');
const ShiprocketService = require('./shiprocketService');
const DailyMetrics = require('../models/DailyMetrics');
const ProductCost = require('../models/ProductCost');
const ProfitCalculations = require('../utils/calculations');
const logger = require('../config/logger');

class DataSyncService {
  async syncUserData(user, startDate, endDate) {
    const errors = [];
    let recordsSynced = 0;

    try {
      // Initialize services
      const shopify = new ShopifyService(user.shopifyStore, user.shopifyAccessToken);
      const metaAds = user.metaAccessToken ? new MetaAdsService(user.metaAccessToken, user.metaAdAccountId) : null;
      const shiprocket = user.shiprocketEmail ? new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword) : null;

      // Fetch data with retry logic
      logger.info('Fetching Shopify orders', { userId: user._id });
      const orders = await this.retryOperation(() => shopify.getOrders(startDate, endDate), 'Shopify Orders');
      
      logger.info('Fetching Meta Ads data', { userId: user._id });
      let adsData = [];
      let campaignsData = [];
      if (metaAds) {
        try {
          adsData = await this.retryOperation(() => metaAds.getInsights(startDate, endDate), 'Meta Ads');
          
          // Fetch individual campaigns
          logger.info('Fetching Meta Ads campaigns', { userId: user._id });
          const campaigns = await this.retryOperation(() => metaAds.getCampaigns(), 'Meta Ads Campaigns');
          
          // Fetch insights for each campaign
          for (const campaign of campaigns) {
            try {
              const insights = await metaAds.getCampaignInsights(campaign.id, startDate, endDate);
              campaignsData.push({
                campaignId: campaign.id,
                campaignName: campaign.name,
                insights: insights
              });
            } catch (err) {
              logger.warn(`Failed to fetch insights for campaign ${campaign.name}`, { error: err.message });
            }
          }
          
          logger.info(`Fetched ${campaignsData.length} campaigns`, { userId: user._id });
        } catch (error) {
          errors.push(`Meta Ads: ${error.message}`);
          logger.warn('Meta Ads fetch failed, continuing without ad data', { error: error.message });
        }
      }

      logger.info('Fetching Shiprocket data', { userId: user._id });
      let shipments = [];
      if (shiprocket) {
        try {
          shipments = await this.retryOperation(() => shiprocket.getShipments(startDate, endDate), 'Shiprocket');
        } catch (error) {
          errors.push(`Shiprocket: ${error.message}`);
          logger.warn('Shiprocket fetch failed, continuing without shipping data', { error: error.message });
        }
      }

      // Get product costs
      const productCosts = {};
      const costs = await ProductCost.find({ userId: user._id });
      costs.forEach(c => {
        productCosts[c.shopifyProductId] = c.cost;
      });

      // Auto-sync product costs from Shopify if missing
      await this.syncProductCosts(user, orders, productCosts);

      // Group data by date
      const dailyData = this.groupByDate(orders, adsData, shipments, campaignsData);

      // Process and save daily metrics
      for (const [date, data] of Object.entries(dailyData)) {
        try {
          const metrics = this.calculateDailyMetrics(data, productCosts);
          
          // Check if we have existing shipping data in database
          const existingMetric = await DailyMetrics.findOne({ 
            userId: user._id, 
            date: new Date(date) 
          });
          
          // If new shipping data is 0 or missing, but we have existing shipping data, preserve it
          if (existingMetric && existingMetric.totalShipments > 0) {
            if (!metrics.totalShipments || metrics.totalShipments === 0) {
              logger.info(`Preserving existing shipping data for ${date}`, { 
                existingShipments: existingMetric.totalShipments 
              });
              
              // Preserve existing shipping data
              metrics.totalShipments = existingMetric.totalShipments;
              metrics.delivered = existingMetric.delivered;
              metrics.inTransit = existingMetric.inTransit;
              metrics.rto = existingMetric.rto;
              metrics.ndr = existingMetric.ndr;
              metrics.deliveryRate = existingMetric.deliveryRate;
              metrics.rtoRate = existingMetric.rtoRate;
              metrics.shippingCost = existingMetric.shippingCost;
              
              // Recalculate net profit with preserved shipping cost
              metrics.netProfit = metrics.grossProfit - metrics.adSpend - metrics.shippingCost;
              metrics.netProfitMargin = metrics.revenue > 0 ? (metrics.netProfit / metrics.revenue) * 100 : 0;
            }
          }
          
          await DailyMetrics.findOneAndUpdate(
            { userId: user._id, date: new Date(date) },
            { ...metrics, userId: user._id, date: new Date(date) },
            { upsert: true, new: true }
          );

          recordsSynced++;
        } catch (error) {
          errors.push(`Date ${date}: ${error.message}`);
          logger.error(`Failed to process date ${date}`, { error: error.message });
        }
      }

      logger.success('Data sync completed', { 
        userId: user._id, 
        recordsSynced, 
        errors: errors.length 
      });

      return { recordsSynced, errors };

    } catch (error) {
      logger.error('Data sync failed', { userId: user._id, error: error.message });
      throw error;
    }
  }

  async syncProductCosts(user, orders, existingCosts) {
    const newProducts = new Set();
    
    orders.forEach(order => {
      order.line_items?.forEach(item => {
        if (item.product_id && !existingCosts[item.product_id]) {
          newProducts.add(item.product_id);
        }
      });
    });

    if (newProducts.size > 0) {
      logger.info(`Found ${newProducts.size} new products, syncing costs`, { userId: user._id });
      
      for (const productId of newProducts) {
        const item = orders
          .flatMap(o => o.line_items || [])
          .find(i => i.product_id === productId);

        if (item && item.product_id) {
          const estimatedCost = parseFloat(item.price || 0) * 0.4; // 40% of price as default cost
          
          await ProductCost.findOneAndUpdate(
            { userId: user._id, shopifyProductId: productId.toString() },
            {
              productName: item.name || 'Unknown Product',
              cost: estimatedCost,
              updatedAt: new Date()
            },
            { upsert: true }
          );

          existingCosts[productId] = estimatedCost;
        }
      }
    }
  }

  calculateDailyMetrics(data, productCosts) {
    const { orders, ads, shipments, campaigns = [] } = data;

    const revenue = ProfitCalculations.calculateRevenue(orders);
    const cogs = ProfitCalculations.calculateCOGS(orders, productCosts);
    
    // Calculate adSpend: if we have campaigns, sum their spend; otherwise use account-level spend
    let adSpend = 0;
    if (campaigns && campaigns.length > 0) {
      adSpend = campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.spend || 0), 0);
    } else {
      adSpend = parseFloat(ads?.spend || 0);
    }
    
    let shippingCost = ProfitCalculations.calculateShippingCost(shipments);
    
    // Handle NaN values
    if (isNaN(shippingCost) || !isFinite(shippingCost)) {
      shippingCost = 0;
    }
    
    const grossProfit = ProfitCalculations.calculateGrossProfit(revenue, cogs);
    const grossProfitMargin = ProfitCalculations.calculateGrossProfitMargin(grossProfit, revenue);
    const netProfit = ProfitCalculations.calculateNetProfit(grossProfit, adSpend, shippingCost);
    const netProfitMargin = ProfitCalculations.calculateNetProfitMargin(netProfit, revenue);
    
    const totalOrders = orders.length;
    const roas = ProfitCalculations.calculateROAS(revenue, adSpend);
    const poas = ProfitCalculations.calculatePOAS(netProfit, adSpend);
    const aov = ProfitCalculations.calculateAOV(revenue, totalOrders);
    const cpp = ProfitCalculations.calculateCPP(adSpend, totalOrders);
    
    // Calculate reach, impressions, clicks: if we have campaigns, sum them; otherwise use account-level
    let reach, impressions, linkClicks;
    if (campaigns && campaigns.length > 0) {
      reach = campaigns.reduce((sum, c) => sum + parseInt(c.reach || 0), 0);
      impressions = campaigns.reduce((sum, c) => sum + parseInt(c.impressions || 0), 0);
      linkClicks = campaigns.reduce((sum, c) => sum + parseInt(c.clicks || 0), 0);
    } else {
      reach = parseInt(ads?.reach || 0);
      impressions = parseInt(ads?.impressions || 0);
      linkClicks = parseInt(ads?.clicks || 0);
    }
    
    const cpc = ProfitCalculations.calculateCPC(adSpend, linkClicks);
    const ctr = ProfitCalculations.calculateCTR(linkClicks, impressions);
    const cpm = ProfitCalculations.calculateCPM(adSpend, impressions);
    
    const customerMetrics = ProfitCalculations.analyzeCustomers(orders);
    const shippingMetrics = ProfitCalculations.analyzeShipments(shipments);

    // Helper function to ensure valid numbers
    const safeNumber = (value) => {
      if (isNaN(value) || !isFinite(value)) return 0;
      return value;
    };

    return {
      totalOrders: safeNumber(totalOrders),
      revenue: safeNumber(revenue),
      cogs: safeNumber(cogs),
      adSpend: safeNumber(adSpend),
      shippingCost: safeNumber(shippingCost),
      grossProfit: safeNumber(grossProfit),
      grossProfitMargin: safeNumber(grossProfitMargin),
      netProfit: safeNumber(netProfit),
      netProfitMargin: safeNumber(netProfitMargin),
      roas: safeNumber(roas),
      poas: safeNumber(poas),
      aov: safeNumber(aov),
      cpp: safeNumber(cpp),
      cpc: safeNumber(cpc),
      ctr: safeNumber(ctr),
      cpm: safeNumber(cpm),
      reach: safeNumber(reach),
      impressions: safeNumber(impressions),
      linkClicks: safeNumber(linkClicks),
      ...customerMetrics,
      ...shippingMetrics,
      campaigns: campaigns // Include campaigns array
    };
  }

  groupByDate(orders, adsData, shipments, campaignsData = []) {
    const grouped = {};

    orders.forEach(order => {
      try {
        // Parse date - handle both ISO format and other formats
        let dateStr;
        if (order.created_at.includes('T')) {
          // ISO format: 2025-10-20T19:57:24+05:30
          dateStr = order.created_at.split('T')[0];
        } else {
          // Parse other formats and convert to YYYY-MM-DD
          const parsedDate = new Date(order.created_at);
          if (!isNaN(parsedDate.getTime())) {
            dateStr = parsedDate.toISOString().split('T')[0];
          } else {
            logger.warn(`Could not parse order date: ${order.created_at}`);
            return;
          }
        }
        
        if (!grouped[dateStr]) grouped[dateStr] = { orders: [], ads: null, shipments: [], campaigns: [] };
        grouped[dateStr].orders.push(order);
      } catch (error) {
        logger.error(`Error parsing order date: ${order.created_at}`, { error: error.message });
      }
    });

    adsData.forEach(ad => {
      const date = ad.date_start;
      if (!grouped[date]) grouped[date] = { orders: [], ads: null, shipments: [], campaigns: [] };
      grouped[date].ads = ad;
    });

    // Group campaigns by date
    campaignsData.forEach(campaign => {
      campaign.insights.forEach(insight => {
        const date = insight.date_start;
        if (!grouped[date]) grouped[date] = { orders: [], ads: null, shipments: [], campaigns: [] };
        
        grouped[date].campaigns.push({
          campaignId: campaign.campaignId,
          campaignName: campaign.campaignName,
          spend: parseFloat(insight.spend || 0),
          reach: parseInt(insight.reach || 0),
          impressions: parseInt(insight.impressions || 0),
          clicks: parseInt(insight.clicks || 0),
          cpc: parseFloat(insight.cpc || 0),
          cpm: parseFloat(insight.cpm || 0),
          ctr: parseFloat(insight.ctr || 0)
        });
      });
    });

    shipments.forEach(shipment => {
      try {
        let dateStr;
        if (shipment.created_at) {
          // Shiprocket format: "26th Oct 2024 08:11 AM"
          // Parse this format to get the date
          const dateMatch = shipment.created_at.match(/(\d+)(st|nd|rd|th)\s+(\w+)\s+(\d{4})/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const monthStr = dateMatch[3];
            const year = dateMatch[4];
            
            const months = {
              'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
              'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
              'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            
            const month = months[monthStr];
            if (month) {
              dateStr = `${year}-${month}-${day}`;
            }
          }
        } else if (shipment.pickup_scheduled_date) {
          dateStr = shipment.pickup_scheduled_date.split(' ')[0];
        }
        
        if (dateStr) {
          if (!grouped[dateStr]) grouped[dateStr] = { orders: [], ads: null, shipments: [], campaigns: [] };
          grouped[dateStr].shipments.push(shipment);
        }
      } catch (error) {
        logger.error(`Error parsing shipment date`, { error: error.message });
      }
    });

    return grouped;
  }

  async retryOperation(operation, name, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        logger.warn(`${name} attempt ${i + 1} failed`, { error: error.message });
        
        if (i === maxRetries - 1) throw error;
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
}

module.exports = DataSyncService;
