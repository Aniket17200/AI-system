require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function checkOctober() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const metrics = await DailyMetrics.find({
      userId: '6882270af4c676a67f2fb70d',
      date: {
        $gte: new Date('2025-10-01'),
        $lte: new Date('2025-10-31')
      }
    }).sort({ date: 1 });

    console.log(`Found ${metrics.length} days in October 2025\n`);

    metrics.forEach(m => {
      console.log(`Date: ${m.date.toISOString().split('T')[0]}`);
      console.log(`  Revenue: ₹${m.revenue || 0}`);
      console.log(`  Orders: ${m.totalOrders || 0}`);
      console.log(`  Ad Spend: ₹${(m.adSpend || 0).toFixed(2)}`);
      console.log(`  Campaigns: ${m.campaigns?.length || 0}`);
      if (m.campaigns && m.campaigns.length > 0) {
        const campaignSpend = m.campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
        console.log(`  Campaign Total Spend: ₹${campaignSpend.toFixed(2)}`);
      }
      console.log(`  Reach: ${m.reach || 0}`);
      console.log(`  Impressions: ${m.impressions || 0}`);
      console.log();
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkOctober();
