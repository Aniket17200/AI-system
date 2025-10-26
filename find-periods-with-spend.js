require('dotenv').config();
const mongoose = require('mongoose');

async function findPeriodsWithSpend() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    const metricsWithSpend = await DailyMetrics.find({
      userId: user._id,
      adSpend: { $gt: 0 }
    }).sort({ date: 1 });

    console.log(`Found ${metricsWithSpend.length} days with ad spend\n`);
    
    if (metricsWithSpend.length > 0) {
      console.log('First 10 days with ad spend:');
      metricsWithSpend.slice(0, 10).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - ₹${m.adSpend.toLocaleString('en-IN')} - Campaigns: ${m.campaigns?.length || 0}`);
      });
      
      console.log('\nLast 10 days with ad spend:');
      metricsWithSpend.slice(-10).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - ₹${m.adSpend.toLocaleString('en-IN')} - Campaigns: ${m.campaigns?.length || 0}`);
      });
      
      const firstDate = metricsWithSpend[0].date;
      const lastDate = metricsWithSpend[metricsWithSpend.length - 1].date;
      
      console.log(`\n📅 Date range with ad spend: ${firstDate.toISOString().split('T')[0]} to ${lastDate.toISOString().split('T')[0]}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

findPeriodsWithSpend();
