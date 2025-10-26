require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function verifyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const metrics = await DailyMetrics.find({ 
      userId: '6882270af4c676a67f2fb70d' 
    }).sort({ date: -1 });

    console.log('=== Data for duttanurag321@gmail.com ===\n');
    console.log(`Total days: ${metrics.length}\n`);

    if (metrics.length > 0) {
      console.log('Sample data (last 5 days):');
      metrics.slice(0, 5).forEach(m => {
        console.log(`\nDate: ${m.date.toISOString().split('T')[0]}`);
        console.log(`  Revenue: ₹${m.revenue || 0}`);
        console.log(`  Orders: ${m.totalOrders || 0}`);
        console.log(`  Ad Spend: ₹${(m.adSpend || 0).toFixed(2)}`);
        console.log(`  ROAS: ${(m.roas || 0).toFixed(2)}x`);
      });

      // Calculate totals
      const totals = metrics.reduce((acc, m) => ({
        revenue: acc.revenue + (m.revenue || 0),
        orders: acc.orders + (m.totalOrders || 0),
        adSpend: acc.adSpend + (m.adSpend || 0)
      }), { revenue: 0, orders: 0, adSpend: 0 });

      console.log('\n=== Totals ===');
      console.log(`Total Revenue: ₹${totals.revenue.toLocaleString()}`);
      console.log(`Total Orders: ${totals.orders}`);
      console.log(`Total Ad Spend: ₹${totals.adSpend.toLocaleString()}`);
      console.log(`Overall ROAS: ${totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0}x`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyData();
