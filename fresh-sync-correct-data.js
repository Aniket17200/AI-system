const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const ProductCost = require('./models/ProductCost');
const ShopifyService = require('./services/shopifyService');
const MetaAdsService = require('./services/metaAdsService');
const ShiprocketService = require('./services/shiprocketService');
require('dotenv').config();

// Asia/Kolkata timezone: UTC +5:30
function convertToKolkataDate(dateString) {
  // Parse date and convert to Kolkata date at midnight UTC
  const date = new Date(dateString);
  const dateOnly = date.toISOString().split('T')[0];
  return new Date(dateOnly + 'T00:00:00.000Z');
}

function groupByDate(orders, adsData, shipments) {
  const grouped = {};

  // Group orders by date
  orders.forEach(order => {
    try {
      let dateStr;
      if (order.created_at.includes('T')) {
        dateStr = order.created_at.split('T')[0];
      } else {
        const parsedDate = new Date(order.created_at);
        if (!isNaN(parsedDate.getTime())) {
          dateStr = parsedDate.toISOString().split('T')[0];
        } else {
          console.warn(`Could not parse order date: ${order.created_at}`);
          return;
        }
      }
      
      if (!grouped[dateStr]) grouped[dateStr] = { orders: [], ads: null, shipments: [] };
      grouped[dateStr].orders.push(order);
    } catch (error) {
      console.error(`Error parsing order date: ${order.created_at}`, error.message);
    }
  });

  // Group ads by date
  adsData.forEach(ad => {
    const date = ad.date_start;
    if (!grouped[date]) grouped[date] = { orders: [], ads: null, shipments: [] };
    grouped[date].ads = ad;
  });

  // Group shipments by date
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
      console.error(`Error parsing shipment date`, error.message);
    }
  });

  return grouped;
}

function calculateDailyMetrics(data, productCosts) {
  const { orders, ads, shipments } = data;

  // Calculate revenue
  const revenue = orders.reduce((sum, order) => {
    return sum + parseFloat(order.total_price || 0);
  }, 0);

  // Calculate COGS (Cost of Goods Sold)
  let cogs = 0;
  orders.forEach(order => {
    order.line_items?.forEach(item => {
      const cost = productCosts[item.product_id] || 0;
      const quantity = item.quantity || 1;
      cogs += cost * quantity;
    });
  });

  // If no product costs available, use 40% of revenue as default
  if (cogs === 0 && revenue > 0) {
    cogs = revenue * 0.4;
  }

  const adSpend = parseFloat(ads?.spend || 0);
  
  // Calculate shipping cost
  const shippingCost = shipments.reduce((sum, shipment) => {
    return sum + parseFloat(shipment.shipping_charges || 0);
  }, 0);
  
  const grossProfit = revenue - cogs;
  const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netProfit = grossProfit - adSpend - shippingCost;
  const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  const totalOrders = orders.length;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  const poas = adSpend > 0 ? netProfit / adSpend : 0;
  const aov = totalOrders > 0 ? revenue / totalOrders : 0;
  const cpp = totalOrders > 0 && adSpend > 0 ? adSpend / totalOrders : 0;
  
  const reach = parseInt(ads?.reach || 0);
  const impressions = parseInt(ads?.impressions || 0);
  const linkClicks = parseInt(ads?.clicks || 0);
  const cpc = linkClicks > 0 ? adSpend / linkClicks : 0;
  const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
  const cpm = impressions > 0 ? (adSpend / impressions) * 1000 : 0;
  
  // Analyze customers
  const customerEmails = new Set();
  const allCustomerEmails = new Set();
  orders.forEach(order => {
    if (order.customer?.email) {
      allCustomerEmails.add(order.customer.email);
    }
  });
  
  const newCustomers = allCustomerEmails.size;
  const returningCustomers = 0; // Would need historical data
  const totalCustomers = newCustomers;
  const returningRate = 0;
  
  // Analyze shipments
  const totalShipments = shipments.length;
  const delivered = shipments.filter(s => s.status === 'DELIVERED').length;
  const inTransit = shipments.filter(s => s.status === 'IN TRANSIT').length;
  const rto = shipments.filter(s => s.status === 'RTO').length;
  const ndr = shipments.filter(s => s.status === 'NDR').length;
  const deliveryRate = totalShipments > 0 ? (delivered / totalShipments) * 100 : 0;
  const rtoRate = totalShipments > 0 ? (rto / totalShipments) * 100 : 0;

  return {
    totalOrders, revenue, cogs, adSpend, shippingCost,
    grossProfit, grossProfitMargin, netProfit, netProfitMargin,
    roas, poas, aov, cpp, cpc, ctr, cpm,
    reach, impressions, linkClicks,
    newCustomers, returningCustomers, totalCustomers, returningRate,
    totalShipments, delivered, inTransit, rto, ndr, deliveryRate, rtoRate
  };
}

async function freshSyncCorrectData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== STEP 1: CLEARING OLD DATA ===');
    const deleteResult = await DailyMetrics.deleteMany({ userId: user._id });
    console.log(`Deleted ${deleteResult.deletedCount} old records`);

    console.log('\n=== STEP 2: FETCHING FRESH DATA FROM APIs ===');
    
    // Initialize services
    const shopify = new ShopifyService(user.shopifyStore, user.shopifyAccessToken);
    const metaAds = user.metaAccessToken ? new MetaAdsService(user.metaAccessToken, user.metaAdAccountId) : null;
    const shiprocket = user.shiprocketEmail ? new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword) : null;

    // Set date range (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Fetch Shopify orders
    console.log('\nFetching Shopify orders...');
    const orders = await shopify.getOrders(startDate, endDate);
    console.log(`✓ Fetched ${orders.length} orders`);

    // Fetch Meta Ads data
    let adsData = [];
    if (metaAds) {
      console.log('\nFetching Meta Ads data...');
      try {
        adsData = await metaAds.getInsights(startDate, endDate);
        console.log(`✓ Fetched ${adsData.length} days of Meta Ads data`);
        const totalAdSpend = adsData.reduce((sum, ad) => sum + parseFloat(ad.spend || 0), 0);
        console.log(`  Total Ad Spend: ₹${totalAdSpend.toFixed(2)}`);
      } catch (error) {
        console.log(`✗ Meta Ads error: ${error.message}`);
      }
    }

    // Fetch Shiprocket data
    let shipments = [];
    if (shiprocket) {
      console.log('\nFetching Shiprocket data...');
      try {
        shipments = await shiprocket.getShipments(startDate, endDate);
        console.log(`✓ Fetched ${shipments.length} shipments`);
      } catch (error) {
        console.log(`✗ Shiprocket error: ${error.message}`);
      }
    }

    // Get product costs
    console.log('\nLoading product costs...');
    const productCosts = {};
    const costs = await ProductCost.find({ userId: user._id });
    costs.forEach(c => {
      productCosts[c.shopifyProductId] = c.cost;
    });
    console.log(`✓ Loaded ${costs.length} product costs`);

    console.log('\n=== STEP 3: PROCESSING AND SAVING DATA ===');
    
    // Group data by date
    const dailyData = groupByDate(orders, adsData, shipments);
    console.log(`Grouped into ${Object.keys(dailyData).length} days`);

    let saved = 0;
    let errors = 0;

    for (const [dateStr, data] of Object.entries(dailyData)) {
      try {
        const metrics = calculateDailyMetrics(data, productCosts);
        const date = convertToKolkataDate(dateStr);
        
        await DailyMetrics.create({
          userId: user._id,
          date: date,
          ...metrics
        });

        saved++;
        
        if (data.orders.length > 0) {
          console.log(`  ${dateStr}: Orders=${data.orders.length}, Revenue=₹${metrics.revenue.toFixed(2)}, AdSpend=₹${metrics.adSpend.toFixed(2)}, ROAS=${metrics.roas.toFixed(2)}`);
        }
      } catch (error) {
        console.error(`  Error on ${dateStr}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n✓ Saved ${saved} records`);
    if (errors > 0) console.log(`✗ ${errors} errors`);

    console.log('\n=== STEP 4: VERIFICATION ===');
    const allMetrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    
    const totals = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      cogs: acc.cogs + (m.cogs || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      shippingCost: acc.shippingCost + (m.shippingCost || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, cogs: 0, netProfit: 0, shippingCost: 0, orders: 0 });
    
    const finalROAS = totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0;
    const finalPOAS = totals.adSpend > 0 ? (totals.netProfit / totals.adSpend).toFixed(2) : 0;
    
    console.log('\nFinal Totals:');
    console.log(`  Total Records: ${allMetrics.length}`);
    console.log(`  Date Range: ${allMetrics[0].date.toISOString().split('T')[0]} to ${allMetrics[allMetrics.length-1].date.toISOString().split('T')[0]}`);
    console.log(`  Total Orders: ${totals.orders}`);
    console.log(`  Total Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`  Total COGS: ₹${totals.cogs.toFixed(2)} (${(totals.cogs/totals.revenue*100).toFixed(1)}%)`);
    console.log(`  Total Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`  Total Shipping: ₹${totals.shippingCost.toFixed(2)}`);
    console.log(`  Total Net Profit: ₹${totals.netProfit.toFixed(2)}`);
    console.log(`  ROAS: ${finalROAS}`);
    console.log(`  POAS: ${finalPOAS}`);
    
    const recordsWithOrders = allMetrics.filter(m => m.totalOrders > 0).length;
    const recordsWithAdSpend = allMetrics.filter(m => m.adSpend > 0).length;
    console.log(`\n  Records with orders: ${recordsWithOrders}`);
    console.log(`  Records with ad spend: ${recordsWithAdSpend}`);

    console.log('\n✅ FRESH SYNC COMPLETE!');
    console.log('Database now contains correct data from APIs with proper Asia/Kolkata timezone handling.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

freshSyncCorrectData();
