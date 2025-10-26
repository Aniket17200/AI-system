require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function addOct25() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userId = '6882270af4c676a67f2fb70d';
    const date = new Date('2025-10-25T00:00:00.000Z');
    
    console.log('Adding entry for Oct 25, 2025\n');
    
    // Check if exists
    const existing = await DailyMetrics.findOne({
      userId,
      date: {
        $gte: new Date('2025-10-25T00:00:00.000Z'),
        $lte: new Date('2025-10-25T23:59:59.999Z')
      }
    });
    
    if (existing) {
      console.log('✓ Oct 25 already has an entry');
      console.log(`  Rev=₹${existing.revenue}, Orders=${existing.totalOrders}`);
    } else {
      await DailyMetrics.create({
        userId,
        date,
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
      
      console.log('✓ Created entry for Oct 25, 2025');
    }

    await mongoose.connection.close();
    console.log('\n✓ Done! Frontend will now load for today.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addOct25();
