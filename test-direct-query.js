require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function testQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const userId = '6882270af4c676a67f2fb70d';
    const startDate = new Date('2025-10-01');
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date('2025-10-31');
    endDate.setHours(23, 59, 59, 999);

    console.log('Query parameters:');
    console.log(`  userId: ${userId}`);
    console.log(`  startDate: ${startDate}`);
    console.log(`  endDate: ${endDate}\n`);

    const metrics = await DailyMetrics.find({
      userId: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    console.log(`Found ${metrics.length} records\n`);

    if (metrics.length > 0) {
      const totals = metrics.reduce((acc, m) => ({
        revenue: acc.revenue + (m.revenue || 0),
        orders: acc.orders + (m.totalOrders || 0),
        adSpend: acc.adSpend + (m.adSpend || 0)
      }), { revenue: 0, orders: 0, adSpend: 0 });

      console.log('Totals:');
      console.log(`  Revenue: ₹${totals.revenue.toLocaleString()}`);
      console.log(`  Orders: ${totals.orders}`);
      console.log(`  Ad Spend: ₹${totals.adSpend.toLocaleString()}`);
      console.log(`  ROAS: ${totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0}x`);

      console.log('\nSample records:');
      metrics.slice(0, 5).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]}: Rev=₹${m.revenue || 0}, Orders=${m.totalOrders || 0}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testQuery();
