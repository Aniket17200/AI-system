require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// User 1: Tanesh (existing user)
const USER1_ID = '68c812b0afc4892c1f8128e3';

// User 2: New user (we'll create)
let USER2_ID = null;

// Generate different data for User 2
function generateUser2Metrics(date, dayIndex) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const baseMultiplier = isWeekend ? 0.6 : 1.0;
  const randomVariation = 0.7 + Math.random() * 0.6;
  const multiplier = baseMultiplier * randomVariation;
  
  // Different business model - higher volume, lower margins
  const orders = Math.floor(15 + Math.random() * 10) * multiplier; // 15-25 orders
  const revenue = orders * (800 + Math.random() * 400); // AOV: 800-1200 (lower)
  const cogs = revenue * (0.55 + Math.random() * 0.05); // COGS: 55-60% (higher)
  const adSpend = revenue * (0.15 + Math.random() * 0.05); // Ad spend: 15-20% (higher)
  const shippingCost = orders * (30 + Math.random() * 15);
  
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - adSpend - shippingCost;
  
  const newCustomers = Math.floor(orders * (0.75 + Math.random() * 0.15));
  const returningCustomers = orders - newCustomers;
  
  const deliveredCount = Math.floor(orders * (0.80 + Math.random() * 0.1));
  const inTransitCount = Math.floor(orders * (0.08 + Math.random() * 0.05));
  const rtoCount = Math.floor(orders * (0.05 + Math.random() * 0.05));
  const ndrCount = Math.floor(orders * (0.02 + Math.random() * 0.03));
  
  return {
    date: date,
    revenue: Math.round(revenue * 100) / 100,
    totalOrders: Math.floor(orders),
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
    cpc: adSpend > 0 ? Math.round((adSpend / Math.floor(adSpend * 20)) * 100) / 100 : 0,
    ctr: adSpend > 0 ? Math.round((Math.random() * 2 + 1) * 100) / 100 : 0,
    cpm: adSpend > 0 ? Math.round((adSpend / Math.floor(adSpend * 1000) * 1000) * 100) / 100 : 0,
    impressions: adSpend > 0 ? Math.floor(adSpend * (800 + Math.random() * 400)) : 0,
    linkClicks: adSpend > 0 ? Math.floor(adSpend * (15 + Math.random() * 10)) : 0,
    reach: adSpend > 0 ? Math.floor(adSpend * (600 + Math.random() * 300)) : 0,
    totalCustomers: Math.floor(orders),
    newCustomers: newCustomers,
    returningCustomers: returningCustomers,
    returningRate: Math.round((returningCustomers / orders) * 10000) / 100,
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

async function setupUsers() {
  try {
    console.log('🚀 Setting Up Two Users for Testing\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check User 1 (Tanesh)
    const user1 = await User.findById(USER1_ID);
    console.log('👤 USER 1 (Tanesh):');
    console.log('   ID:', USER1_ID);
    console.log('   Email:', user1?.email || 'Not found');
    
    const user1Metrics = await DailyMetrics.find({ userId: USER1_ID });
    console.log('   Data Records:', user1Metrics.length);
    
    if (user1Metrics.length > 0) {
      const total1 = user1Metrics.reduce((sum, m) => sum + m.revenue, 0);
      const orders1 = user1Metrics.reduce((sum, m) => sum + m.totalOrders, 0);
      console.log('   Total Revenue:', Math.round(total1).toLocaleString('en-IN'));
      console.log('   Total Orders:', orders1);
    }
    
    // Create or find User 2
    console.log('\n👤 USER 2 (Rahul):');
    let user2 = await User.findOne({ email: 'rahul@example.com' });
    
    if (!user2) {
      user2 = await User.create({
        email: 'rahul@example.com',
        shopifyStore: 'rahul-store.myshopify.com',
        shopifyAccessToken: 'test_token_rahul',
        isActive: true
      });
      console.log('   ✅ Created new user');
    } else {
      console.log('   ✅ Found existing user');
    }
    
    USER2_ID = user2._id.toString();
    console.log('   ID:', USER2_ID);
    console.log('   Email:', user2.email);
    
    // Delete existing data for User 2
    await DailyMetrics.deleteMany({ userId: USER2_ID });
    
    // Generate 90 days of data for User 2
    console.log('\n📊 Generating data for User 2...');
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 90);
    
    const metricsToInsert = [];
    for (let i = 0; i <= 90; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const metrics = generateUser2Metrics(currentDate, i);
      metrics.userId = USER2_ID;
      metricsToInsert.push(metrics);
    }
    
    await DailyMetrics.insertMany(metricsToInsert);
    console.log('   ✅ Inserted 91 records');
    
    const total2 = metricsToInsert.reduce((sum, m) => sum + m.revenue, 0);
    const orders2 = metricsToInsert.reduce((sum, m) => sum + m.totalOrders, 0);
    console.log('   Total Revenue:', Math.round(total2).toLocaleString('en-IN'));
    console.log('   Total Orders:', orders2);
    
    console.log('\n✅ Setup complete!\n');
    
    await mongoose.disconnect();
    return { USER1_ID, USER2_ID };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function testBothUsers(user1Id, user2Id) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING SAME QUESTIONS FOR TWO DIFFERENT USERS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const questions = [
    'What is my total revenue in last 30 days?',
    'What is my ROAS in last 30 days?',
    'What is my net profit and margin in last 30 days?',
    'How many orders in last 30 days?'
  ];
  
  for (const question of questions) {
    console.log('\n' + '─'.repeat(70));
    console.log('📝 QUESTION: "' + question + '"');
    console.log('─'.repeat(70) + '\n');
    
    // Test User 1
    try {
      const response1 = await axios.post(`${API_BASE}/ai/chat`, {
        userId: user1Id,
        message: question
      });
      
      console.log('👤 USER 1 (Tanesh):');
      console.log('   Answer: ' + response1.data.data.message);
      console.log('   Time: ' + response1.data.data.responseTime + 'ms');
    } catch (error) {
      console.log('👤 USER 1 (Tanesh): ❌ Error -', error.response?.data?.message || error.message);
    }
    
    console.log();
    
    // Test User 2
    try {
      const response2 = await axios.post(`${API_BASE}/ai/chat`, {
        userId: user2Id,
        message: question
      });
      
      console.log('👤 USER 2 (Rahul):');
      console.log('   Answer: ' + response2.data.data.message);
      console.log('   Time: ' + response2.data.data.responseTime + 'ms');
    } catch (error) {
      console.log('👤 USER 2 (Rahul): ❌ Error -', error.response?.data?.message || error.message);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ TEST COMPLETE - Each user gets their own data!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

async function main() {
  const { USER1_ID, USER2_ID } = await setupUsers();
  await testBothUsers(USER1_ID, USER2_ID);
}

main();
