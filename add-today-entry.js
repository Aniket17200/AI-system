require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function addToday() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userId = '6882270af4c676a67f2fb70d';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`Adding entry for today: ${todayStr}\n`);
    
    // Check if exists
    const existing = await DailyMetrics.findOne({
      userId,
      date: {
        $gte: new Date(todayStr + 'T00:00:00.000Z'),
        $lte: new Date(todayStr + 'T23:59:59.999Z')
      }
    });
    
    if (existing) {
      console.log('✓ Today already has an entry');
    } else {
      await DailyMetrics.create({
        userId,
        date: today,
        revenue: 0,
        totalOrders: 0,
        adSpend: 0,
        cogs: 0,
        grossProfit: 0,
        grossProfitMargin: 0,
        netProfit: 0,
        netProfitMargin: 0,
        roas: 0,
        poas: 0,
        aov: 0,
        cpp: 0,
        cpc: 0,
        ctr: 0,
        cpm: 0,
        reach: 0,
        impressions: 0,
        linkClicks: 0,
        newCustomers: 0,
        returningCustomers: 0,
        totalCustomers: 0,
        returningRate: 0,
        totalShipments: 0,
        delivered: 0,
        inTransit: 0,
        rto: 0,
        ndr: 0,
        deliveryRate: 0,
        rtoRate: 0,
        shippingCost: 0,
        campaigns: []
      });
      
      console.log('✓ Created entry for today');
    }
    
    // Verify
    const todayEntry = await DailyMetrics.findOne({
      userId,
      date: {
        $gte: new Date(todayStr + 'T00:00:00.000Z'),
        $lte: new Date(todayStr + 'T23:59:59.999Z')
      }
    });
    
    console.log(`\n✓ Today (${todayStr}): Rev=₹${todayEntry.revenue}, Orders=${todayEntry.totalOrders}`);

    await mongoose.connection.close();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addToday();
