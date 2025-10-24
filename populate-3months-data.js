require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

const USER_ID = '68c812b0afc4892c1f8128e3';

// Generate realistic daily metrics for 3 months
function generateDailyMetrics(date, dayIndex) {
  // Create variation in data (weekends lower, some days higher)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const baseMultiplier = isWeekend ? 0.7 : 1.0;
  const randomVariation = 0.8 + Math.random() * 0.4; // 80% to 120%
  const multiplier = baseMultiplier * randomVariation;
  
  // Base daily metrics
  const orders = Math.floor(5 + Math.random() * 8) * multiplier; // 5-13 orders per day
  const revenue = orders * (1500 + Math.random() * 500); // AOV: 1500-2000
  const cogs = revenue * (0.35 + Math.random() * 0.05); // COGS: 35-40%
  const adSpend = revenue * (0.08 + Math.random() * 0.04); // Ad spend: 8-12% of revenue
  const shippingCost = orders * (40 + Math.random() * 20); // 40-60 per order
  
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - adSpend - shippingCost;
  
  const newCustomers = Math.floor(orders * (0.85 + Math.random() * 0.1)); // 85-95% new
  const returningCustomers = orders - newCustomers;
  
  const deliveredCount = Math.floor(orders * (0.85 + Math.random() * 0.1));
  const inTransitCount = Math.floor(orders * (0.05 + Math.random() * 0.05));
  const rtoCount = Math.floor(orders * (0.02 + Math.random() * 0.03));
  const ndrCount = Math.floor(orders * (0.01 + Math.random() * 0.02));
  
  return {
    userId: USER_ID,
    date: date,
    
    // Sales metrics (match schema field names)
    revenue: Math.round(revenue * 100) / 100,
    totalOrders: Math.floor(orders),
    aov: Math.round((revenue / orders) * 100) / 100,
    
    // Cost metrics
    cogs: Math.round(cogs * 100) / 100,
    adSpend: Math.round(adSpend * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    
    // Profit metrics
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossProfitMargin: Math.round((grossProfit / revenue) * 10000) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netProfitMargin: Math.round((netProfit / revenue) * 10000) / 100,
    
    // Marketing metrics
    roas: adSpend > 0 ? Math.round((revenue / adSpend) * 100) / 100 : 0,
    poas: adSpend > 0 ? Math.round((netProfit / adSpend) * 100) / 100 : 0,
    cpp: orders > 0 ? Math.round((adSpend / orders) * 100) / 100 : 0,
    cpc: adSpend > 0 ? Math.round((adSpend / Math.floor(adSpend * 20)) * 100) / 100 : 0,
    ctr: adSpend > 0 ? Math.round((Math.random() * 2 + 1) * 100) / 100 : 0,
    cpm: adSpend > 0 ? Math.round((adSpend / Math.floor(adSpend * 1000) * 1000) * 100) / 100 : 0,
    impressions: adSpend > 0 ? Math.floor(adSpend * (800 + Math.random() * 400)) : 0,
    linkClicks: adSpend > 0 ? Math.floor(adSpend * (15 + Math.random() * 10)) : 0,
    reach: adSpend > 0 ? Math.floor(adSpend * (600 + Math.random() * 300)) : 0,
    
    // Customer metrics
    totalCustomers: Math.floor(orders),
    newCustomers: newCustomers,
    returningCustomers: returningCustomers,
    returningRate: Math.round((returningCustomers / orders) * 10000) / 100,
    
    // Shipping metrics (match schema field names)
    totalShipments: Math.floor(orders),
    delivered: deliveredCount,
    inTransit: inTransitCount,
    rto: rtoCount,
    ndr: ndrCount,
    deliveryRate: Math.round((deliveredCount / orders) * 10000) / 100,
    rtoRate: Math.round((rtoCount / orders) * 10000) / 100,
    
    createdAt: new Date()
  };
}

async function populate3MonthsData() {
  try {
    console.log('🚀 Populating 3 Months of Historical Data\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Calculate date range (last 90 days)
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 90);
    
    console.log('📅 Date Range:');
    console.log('   Start:', startDate.toISOString().split('T')[0]);
    console.log('   End:', endDate.toISOString().split('T')[0]);
    console.log('   Days: 90\n');
    
    // Delete existing data for this user
    console.log('🗑️  Deleting existing data...');
    const deleteResult = await DailyMetrics.deleteMany({ userId: USER_ID });
    console.log(`   Deleted ${deleteResult.deletedCount} existing records\n`);
    
    // Generate data for each day
    console.log('📊 Generating daily metrics...\n');
    const metricsToInsert = [];
    
    for (let i = 0; i <= 90; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const metrics = generateDailyMetrics(currentDate, i);
      metricsToInsert.push(metrics);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Generated ${i + 1}/91 days...`);
      }
    }
    
    // Insert all metrics
    console.log('\n💾 Inserting data into database...');
    const insertResult = await DailyMetrics.insertMany(metricsToInsert);
    console.log(`✅ Inserted ${insertResult.length} records\n`);
    
    // Calculate totals
    const totals = metricsToInsert.reduce((acc, m) => ({
      revenue: acc.revenue + m.revenue,
      orders: acc.orders + m.totalOrders,
      netProfit: acc.netProfit + m.netProfit,
      adSpend: acc.adSpend + m.adSpend
    }), { revenue: 0, orders: 0, netProfit: 0, adSpend: 0 });
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📈 SUMMARY (90 Days)');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`   Total Revenue:     ₹${totals.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`   Total Orders:      ${totals.orders}`);
    console.log(`   Total Net Profit:  ₹${totals.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`   Total Ad Spend:    ₹${totals.adSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`   Average AOV:       ₹${Math.round(totals.revenue / totals.orders).toLocaleString('en-IN')}`);
    console.log(`   Net Margin:        ${Math.round((totals.netProfit / totals.revenue) * 100)}%`);
    console.log(`   ROAS:              ${(totals.revenue / totals.adSpend).toFixed(2)}x`);
    console.log('\n✅ 3-Month historical data populated successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populate3MonthsData();
