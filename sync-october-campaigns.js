require('dotenv').config();
const mongoose = require('mongoose');
const DataSyncService = require('./services/dataSyncService');

async function syncOctoberCampaigns() {
  try {
    console.log('🔄 Syncing October 2025 Campaign Data\n');
    console.log('=' .repeat(70));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.email}\n`);

    const syncService = new DataSyncService();
    
    // Sync October data
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-25');

    console.log(`📅 Syncing: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);
    console.log('This will fetch:');
    console.log('  - Shopify orders');
    console.log('  - Meta Ads campaigns and insights');
    console.log('  - Shiprocket shipments');
    console.log('  - Calculate and store daily metrics\n');

    const result = await syncService.syncUserData(user, startDate, endDate);

    console.log('\n' + '=' .repeat(70));
    console.log('✅ Sync completed!\n');
    console.log(`📊 Records synced: ${result.recordsSynced}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Check if campaigns were stored
    const DailyMetrics = require('./models/DailyMetrics');
    const metricsWithCampaigns = await DailyMetrics.find({ 
      userId: user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      campaigns: { $exists: true, $ne: [] }
    }).sort({ date: 1 });

    console.log(`\n✅ Days with campaigns in database: ${metricsWithCampaigns.length}`);
    
    if (metricsWithCampaigns.length > 0) {
      console.log('\nSample days:');
      metricsWithCampaigns.slice(0, 5).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - ${m.campaigns.length} campaigns, Spend: ₹${m.adSpend.toLocaleString('en-IN')}`);
      });
      
      console.log('\nSample campaigns from first day:');
      metricsWithCampaigns[0].campaigns.slice(0, 5).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.campaignName} - ₹${c.spend.toLocaleString('en-IN')}`);
      });
    }

    console.log('\n✅ October campaign data synced successfully!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

syncOctoberCampaigns();
