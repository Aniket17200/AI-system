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
      if (metaAds) {
        try {
          adsData = await this.retryOperation(() => metaAds.getInsights(startDate, endDate), 'Meta Ads');
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
      const dailyData = this.groupByDate(orders, adsData, shipments);

      // Process and save daily metrics
      for (const [date, data] of Object.entries(dailyData)) {
        try {
          const metrics = this.calculateDailyMetrics(data, productCosts);
          
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
        if (!existingCosts[item.product_id]) {
          newProducts.add(item.product_id);
        }
      });
    });

    if (newProducts.size > 0) {
      logger.info(`Found ${newProducts.size} new products, syncing costs`, { userId: user._id });
      
      for (const productId of newProducts) {
        const item = orders
          .flatMap(o => o.line_items)
          .find(i => i.product_id === productId);

        if (item) {
          const estimatedCost = parseFloat(item.price) * 0.4; // 40% of price as default cost
          
          await ProductCost.findOneAndUpdate(
            { userId: user._id, shopifyProductId: productId.toString() },
            {
              productName: item.name,
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
    const { orders, ads, shipments } = data;

    const revenue = ProfitCalculations.calculateRevenue(orders);
    const cogs = ProfitCalculations.calculateCOGS(orders, productCosts);
    const adSpend = parseFloat(ads?.spend || 0);
    const shippingCost = ProfitCalculations.calculateShippingCost(shipments);
    
    const grossProfit = ProfitCalculations.calculateGrossProfit(revenue, cogs);
    const grossProfitMargin = ProfitCalculations.calculateGrossProfitMargin(grossProfit, revenue);
    const netProfit = ProfitCalculations.calculateNetProfit(grossProfit, adSpend, shippingCost);
    const netProfitMargin = ProfitCalculations.calculateNetProfitMargin(netProfit, revenue);
    
    const totalOrders = orders.length;
    const roas = ProfitCalculations.calculateROAS(revenue, adSpend);
    const poas = ProfitCalculations.calculatePOAS(netProfit, adSpend);
    const aov = ProfitCalculations.calculateAOV(revenue, totalOrders);
    const cpp = ProfitCalculations.calculateCPP(adSpend, totalOrders);
    
    const reach = parseInt(ads?.reach || 0);
    const impressions = parseInt(ads?.impressions || 0);
    const linkClicks = parseInt(ads?.clicks || 0);
    const cpc = ProfitCalculations.calculateCPC(adSpend, linkClicks);
    const ctr = ProfitCalculations.calculateCTR(linkClicks, impressions);
    const cpm = ProfitCalculations.calculateCPM(adSpend, impressions);
    
    const customerMetrics = ProfitCalculations.analyzeCustomers(orders);
    const shippingMetrics = ProfitCalculations.analyzeShipments(shipments);

    return {
      totalOrders, revenue, cogs, adSpend, shippingCost,
      grossProfit, grossProfitMargin, netProfit, netProfitMargin,
      roas, poas, aov, cpp, cpc, ctr, cpm,
      reach, impressions, linkClicks,
      ...customerMetrics,
      ...shippingMetrics
    };
  }

  groupByDate(orders, adsData, shipments) {
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
        
        if (!grouped[dateStr]) grouped[dateStr] = { orders: [], ads: null, shipments: [] };
        grouped[dateStr].orders.push(order);
      } catch (error) {
        logger.error(`Error parsing order date: ${order.created_at}`, { error: error.message });
      }
    });

    adsData.forEach(ad => {
      const date = ad.date_start;
      if (!grouped[date]) grouped[date] = { orders: [], ads: null, shipments: [] };
      grouped[date].ads = ad;
    });

    shipments.forEach(shipment => {
      try {
        let dateStr;
        if (shipment.created_at) {
          if (shipment.created_at.includes('T')) {
            dateStr = shipment.created_at.split('T')[0];
          } else {
            const parsedDate = new Date(shipment.created_at);
            if (!isNaN(parsedDate.getTime())) {
              dateStr = parsedDate.toISOString().split('T')[0];
            }
          }
        } else if (shipment.pickup_scheduled_date) {
          dateStr = shipment.pickup_scheduled_date.split(' ')[0];
        }
        
        if (dateStr) {
          if (!grouped[dateStr]) grouped[dateStr] = { orders: [], ads: null, shipments: [] };
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
