require('dotenv').config();
const mongoose = require('mongoose');

async function checkAllCampaignDays() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    // Get all metrics in date range
    const allMetrics = await DailyMetrics.find({ 
      userId: user._id,
      date: {
        $gte: new Date('2025-07-27'),
        $lte: new Date('2025-10-25')
      }
    }).sort({ date: 1 });
    
    console.log(`Total days with data: ${allMetrics.length}\n`);
    
    // Check which days have campaigns
    const daysWithCampaigns = allMetrics.filter(m => m.campaigns && m.campaigns.length > 0);
    const daysWithoutCampaigns = allMetrics.filter(m => !m.campaigns || m.campaigns.length === 0);
    
    console.log(`Days WITH campaigns: ${daysWithCampaigns.length}`);
    console.log(`Days WITHOUT campaigns: ${daysWithoutCampaigns.length}\n`);
    
    if (daysWithCampaigns.length > 0) {
      console.log('Days with campaigns:');
      daysWithCampaigns.forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - ${m.campaigns.length} campaigns, Ad Spend: ₹${m.adSpend}`);
      });
    }
    
    if (daysWithoutCampaigns.length > 0) {
      console.log('\nSample days WITHOUT campaigns (first 10):');
      daysWithoutCampaigns.slice(0, 10).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - Ad Spend: ₹${m.adSpend}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkAllCampaignDays();
