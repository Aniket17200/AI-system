require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function checkRecentDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userId = '6882270af4c676a67f2fb70d';
    
    // Check last 7 days
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('=== Checking Recent Dates for Anurag ===\n');
    
    for (const dateStr of dates) {
      const metric = await DailyMetrics.findOne({
        userId,
        date: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lte: new Date(dateStr + 'T23:59:59.999Z')
        }
      });
      
      if (metric) {
        console.log(`✓ ${dateStr}: Revenue=₹${metric.revenue || 0}, Orders=${metric.totalOrders || 0}, AdSpend=₹${(metric.adSpend || 0).toFixed(0)}`);
      } else {
        console.log(`✗ ${dateStr}: No data`);
      }
    }
    
    // Check what's the latest date with data
    const latest = await DailyMetrics.findOne({ userId }).sort({ date: -1 });
    
    console.log(`\n=== Latest Data ===`);
    if (latest) {
      console.log(`Date: ${latest.date.toISOString().split('T')[0]}`);
      console.log(`Revenue: ₹${latest.revenue || 0}`);
      console.log(`Orders: ${latest.totalOrders || 0}`);
    } else {
      console.log('No data found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRecentDates();
