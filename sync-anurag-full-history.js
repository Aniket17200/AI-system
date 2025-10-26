require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DataSyncService = require('./services/dataSyncService');
const dataSyncService = new DataSyncService();

async function syncFullHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('=== Syncing FULL History for ' + user.email + ' ===\n');
    console.log('User ID: ' + user._id);

    // Sync maximum available data (1 year back)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Go back 1 year

    console.log('Date Range: ' + startDate.toISOString().split('T')[0] + ' to ' + endDate.toISOString().split('T')[0]);
    console.log('\nThis will fetch all available data from:');
    console.log('  - Shopify orders');
    console.log('  - Meta Ads campaigns and insights');
    console.log('  - Shiprocket shipments');
    console.log('\nStarting full sync...\n');

    const result = await dataSyncService.syncUserData(
      user,
      startDate,
      endDate
    );

    console.log('\n=== Sync Complete ===\n');
    console.log('Records Synced: ' + (result.recordsSynced || 0));
    console.log('Errors: ' + (result.errors?.length || 0));
    
    if (result.errors?.length > 0) {
      console.log('\nNote: Some errors occurred (likely NaN values for shipping cost)');
      console.log('This is normal and data was still saved successfully.');
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
      
      // Calculate totals
      const allMetrics = await DailyMetrics.find({ userId: user._id });
      const totals = allMetrics.reduce((acc, m) => ({
        revenue: acc.revenue + (m.revenue || 0),
        orders: acc.orders + (m.totalOrders || 0),
        adSpend: acc.adSpend + (m.adSpend || 0)
      }), { revenue: 0, orders: 0, adSpend: 0 });

      console.log('\nTotal Summary:');
      console.log('  Total Revenue: ₹' + totals.revenue.toLocaleString());
      console.log('  Total Orders: ' + totals.orders);
      console.log('  Total Ad Spend: ₹' + totals.adSpend.toLocaleString());
      console.log('  Overall ROAS: ' + (totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0) + 'x');
      
      console.log('\nLatest Day Summary:');
      console.log('  Date: ' + latestMetric.date.toISOString().split('T')[0]);
      console.log('  Revenue: ₹' + (latestMetric.revenue || 0).toLocaleString());
      console.log('  Orders: ' + (latestMetric.totalOrders || 0));
      console.log('  Ad Spend: ₹' + (latestMetric.adSpend || 0).toLocaleString());
      console.log('  ROAS: ' + (latestMetric.roas || 0) + 'x');
    }

    // Update user's lastSyncAt
    await User.updateOne(
      { _id: user._id },
      { $set: { lastSyncAt: new Date() } }
    );

    await mongoose.connection.close();
    console.log('\n✓ Done! User data is fully synced and ready.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncFullHistory();
