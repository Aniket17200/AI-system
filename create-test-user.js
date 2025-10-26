require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');

const USER_ID = '68c812b0afc4892c1f8128e3';

function generateMetrics(date, dayIndex) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const baseMultiplier = isWeekend ? 0.7 : 1.0;
  const randomVariation = 0.8 + Math.random() * 0.4;
  const multiplier = baseMultiplier * randomVariation;
  
  const orders = Math.floor((20 + Math.random() * 15) * multiplier);
  const revenue = orders * (1200 + Math.random() * 800);
  const cogs = revenue * (0.40 + Math.random() * 0.05);
  const adSpend = revenue * (0.12 + Math.random() * 0.03);
  const shippingCost = orders * (40 + Math.random() * 20);
  
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - adSpend - shippingCost;
  
  const newCustomers = Math.floor(orders * (0.65 + Math.random() * 0.15));
  const returningCustomers = orders - newCustomers;
  
  const deliveredCount = Math.floor(orders * (0.85 + Math.random() * 0.1));
  const inTransitCount = Math.floor(orders * (0.08 + Math.random() * 0.04));
  const rtoCount = Math.floor(orders * (0.03 + Math.random() * 0.03));
  const ndrCount = Math.floor(orders * (0.01 + Math.random() * 0.02));
  
  const impressions = Math.floor(adSpend * (1000 + Math.random() * 500));
  const linkClicks = Math.floor(adSpend * (20 + Math.random() * 15));
  const reach = Math.floor(adSpend * (700 + Math.random() * 400));
  
  return {
    userId: USER_ID,
    date: date,
    revenue: Math.round(revenue * 100) / 100,
    totalOrders: orders,
    aov: Math.round((revenue / orders) * 100) / 100,
    cogs: Math.round(cogs * 100) / 100,
    adSpend: Math.round(adSpend * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossProfitMargin: Math.round((grossProfit / revenue) * 10000) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netProfitMargin: Math.round((netProfit / revenue) * 10000) / 100,
    roas: adSpend > 0 ? Math.round((revenue / adSpend) * 100) / 100 : 0,
    poas: adSpend > 0 ? Math.round((netProfit / adSpend) * 100) / 100 : 0,
    cpp: orders > 0 ? Math.round((adSpend / orders) * 100) / 100 : 0,
    cpc: linkClicks > 0 ? Math.round((adSpend / linkClicks) * 100) / 100 : 0,
    ctr: impressions > 0 ? Math.round((linkClicks / impressions) * 10000) / 100 : 0,
    cpm: impressions > 0 ? Math.round((adSpend / impressions * 1000) * 100) / 100 : 0,
    impressions: impressions,
    linkClicks: linkClicks,
    reach: reach,
    totalCustomers: orders,
    newCustomers: newCustomers,
    returningCustomers: returningCustomers,
    returningRate: Math.round((returningCustomers / orders) * 10000) / 100,
    totalShipments: orders,
    delivered: deliveredCount,
    inTransit: inTransitCount,
    rto: rtoCount,
    ndr: ndrCount,
    deliveryRate: Math.round((deliveredCount / orders) * 10000) / 100,
    rtoRate: Math.round((rtoCount / orders) * 10000) / 100,
    createdAt: new Date()
  };
}

async function createTestUser() {
  try {
    console.log('🚀 Creating Test User and Data\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check if user exists
    let user = await User.findById(USER_ID);
    
    if (!user) {
      // Create user with specific ID
      user = new User({
        _id: USER_ID,
        email: 'tanesh@example.com',
        name: 'Tanesh',
        shopifyStore: 'tanesh-store.myshopify.com',
        shopifyAccessToken: 'test_token_tanesh',
        metaAccessToken: 'test_meta_token',
        shiprocketEmail: 'tanesh@shiprocket.com',
        shiprocketPassword: 'test_password',
        isActive: true
      });
      await user.save();
      console.log('✅ Created user:', user.email);
    } else {
      console.log('✅ User already exists:', user.email);
    }
    
    // Delete existing metrics
    await DailyMetrics.deleteMany({ userId: USER_ID });
    console.log('✅ Cleared old metrics\n');
    
    // Generate 90 days of data
    console.log('📊 Generating 90 days of data...');
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 90);
    
    const metricsToInsert = [];
    for (let i = 0; i <= 90; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const metrics = generateMetrics(currentDate, i);
      metricsToInsert.push(metrics);
    }
    
    await DailyMetrics.insertMany(metricsToInsert);
    console.log('✅ Inserted 91 days of metrics\n');
    
    // Calculate totals
    const totalRevenue = metricsToInsert.reduce((sum, m) => sum + m.revenue, 0);
    const totalOrders = metricsToInsert.reduce((sum, m) => sum + m.totalOrders, 0);
    const totalProfit = metricsToInsert.reduce((sum, m) => sum + m.netProfit, 0);
    
    console.log('📈 Summary:');
    console.log('   User ID:', USER_ID);
    console.log('   Email:', user.email);
    console.log('   Days:', metricsToInsert.length);
    console.log('   Total Revenue: ₹' + Math.round(totalRevenue).toLocaleString('en-IN'));
    console.log('   Total Orders:', totalOrders);
    console.log('   Total Net Profit: ₹' + Math.round(totalProfit).toLocaleString('en-IN'));
    console.log('\n✅ Test user created successfully!\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestUser();
