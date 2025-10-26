require('dotenv').config();
const mongoose = require('mongoose');
const DataSyncService = require('./services/dataSyncService');

async function syncWithCampaigns() {
  try {
    console.log('🔄 Starting data sync with campaigns...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.email}\n`);

    const syncService = new DataSyncService();
    
    const startDate = new Date('2025-07-27');
    const endDate = new Date('2025-10-25');

    console.log(`📅 Syncing data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    const result = await syncService.syncUserData(user, startDate, endDate);

    console.log('\n✅ Sync completed!');
    console.log(`📊 Records synced: ${result.recordsSynced}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Check if campaigns were stored
    const DailyMetrics = require('./models/DailyMetrics');
    const sampleMetric = await DailyMetrics.findOne({ 
      userId: user._id,
      campaigns: { $exists: true, $ne: [] }
    }).sort({ date: -1 });

    if (sampleMetric && sampleMetric.campaigns) {
      console.log(`\n✅ Campaigns stored in database: ${sampleMetric.campaigns.length} campaigns`);
      console.log('\nSample campaigns:');
      sampleMetric.campaigns.slice(0, 3).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.campaignName} - Spend: ₹${c.spend}`);
      });
    } else {
      console.log('\n⚠️  No campaigns found in database');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

syncWithCampaigns();
