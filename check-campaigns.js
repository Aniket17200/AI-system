const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

async function checkCampaigns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    console.log('=== USER META ADS INFO ===');
    console.log('Meta Ad Account ID:', user.metaAdAccountId);
    console.log('Account Type: Account-level data (not campaign-specific)');
    
    const metrics = await DailyMetrics.find({ 
      userId: user._id, 
      adSpend: { $gt: 0 } 
    }).sort({ date: 1 });
    
    console.log('\n=== AD DATA IN DATABASE ===');
    console.log('Days with ad data:', metrics.length);
    
    if (metrics.length > 0) {
      console.log('\nSample record:');
      console.log('Date:', metrics[0].date.toISOString().split('T')[0]);
      console.log('Ad Spend:', metrics[0].adSpend);
      console.log('Reach:', metrics[0].reach);
      console.log('Impressions:', metrics[0].impressions);
      console.log('Clicks:', metrics[0].linkClicks);
    }
    
    console.log('\n=== CAMPAIGN STRUCTURE ===');
    console.log('Current: Single "Campaign 1" (account-level aggregate)');
    console.log('Reality: Meta Ads API returns account-level data, not individual campaigns');
    console.log('Solution: Display as "All Campaigns" or keep as single campaign');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkCampaigns();
