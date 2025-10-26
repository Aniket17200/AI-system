require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DataSyncService = require('./services/dataSyncService');
const dataSyncService = new DataSyncService();

async function syncUserData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('=== Syncing Data for ' + user.email + ' ===\n');
    console.log('User ID: ' + user._id);

    // Calculate date range (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    console.log('Date Range: ' + startDate.toISOString().split('T')[0] + ' to ' + endDate.toISOString().split('T')[0]);
    console.log('\nStarting sync...\n');

    // Sync data
    const result = await dataSyncService.syncUserData(
      user,
      startDate,
      endDate
    );

    console.log('\n=== Sync Complete ===\n');
    console.log('Records Synced: ' + (result.recordsSynced || 0));
    console.log('Errors: ' + (result.errors?.length || 0));
    if (result.errors?.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(err => console.log('  - ' + err));
    }

    // Verify data
    const DailyMetrics = require('./models/DailyMetrics');
    const metricsCount = await DailyMetrics.countDocuments({ userId: user._id });
    console.log('\n✓ Total metrics records in database: ' + metricsCount);

    if (metricsCount > 0) {
      const latestMetric = await DailyMetrics.findOne({ userId: user._id }).sort({ date: -1 });
      const oldestMetric = await DailyMetrics.findOne({ userId: user._id }).sort({ date: 1 });
      
      console.log('\nData Range:');
      console.log('  From: ' + oldestMetric.date.toISOString().split('T')[0]);
      console.log('  To: ' + latestMetric.date.toISOString().split('T')[0]);
      
      console.log('\nLatest Day Summary:');
      console.log('  Revenue: ₹' + (latestMetric.revenue || 0).toLocaleString());
      console.log('  Orders: ' + (latestMetric.orders || 0));
      console.log('  Ad Spend: ₹' + (latestMetric.adSpend || 0).toLocaleString());
      console.log('  ROAS: ' + (latestMetric.roas || 0) + 'x');
    }

    await mongoose.connection.close();
    console.log('\n✓ Done! User data is ready.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncUserData();
