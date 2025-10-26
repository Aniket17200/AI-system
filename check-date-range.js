require('dotenv').config();
const mongoose = require('mongoose');

async function checkDateRange() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    const metrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    
    if (metrics.length > 0) {
      const firstDate = metrics[0].date;
      const lastDate = metrics[metrics.length - 1].date;
      
      console.log(`Total records: ${metrics.length}`);
      console.log(`First date: ${firstDate.toISOString().split('T')[0]}`);
      console.log(`Last date: ${lastDate.toISOString().split('T')[0]}`);
      
      // Check if any have campaigns
      const withCampaigns = metrics.filter(m => m.campaigns && m.campaigns.length > 0);
      console.log(`\nRecords with campaigns: ${withCampaigns.length}`);
      
      if (withCampaigns.length > 0) {
        console.log('\nSample campaign data:');
        withCampaigns[0].campaigns.slice(0, 3).forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.campaignName} - Spend: ₹${c.spend}`);
        });
      }
    } else {
      console.log('No metrics found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkDateRange();
