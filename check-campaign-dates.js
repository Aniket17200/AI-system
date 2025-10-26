require('dotenv').config();
const mongoose = require('mongoose');

async function checkCampaignDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    const metricsWithCampaigns = await DailyMetrics.find({ 
      userId: user._id,
      campaigns: { $exists: true, $ne: [] }
    }).sort({ date: 1 });
    
    console.log(`Found ${metricsWithCampaigns.length} days with campaigns\n`);
    
    if (metricsWithCampaigns.length > 0) {
      console.log('First 5 dates with campaigns:');
      metricsWithCampaigns.slice(0, 5).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.date.toISOString().split('T')[0]} - ${m.campaigns.length} campaigns`);
      });
      
      console.log('\nSample campaigns from first date:');
      metricsWithCampaigns[0].campaigns.slice(0, 5).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.campaignName} - Spend: ₹${c.spend.toFixed(2)}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkCampaignDates();
