require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DataSyncService = require('./services/dataSyncService');
const dataSyncService = new DataSyncService();

async function syncLatest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('=== Syncing Latest Data for ' + user.email + ' ===\n');

    // Sync last 7 days to get today and recent data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    console.log(`Syncing: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    const result = await dataSyncService.syncUserData(
      user,
      startDate,
      endDate
    );

    console.log('\n=== Sync Complete ===');
    console.log('Records Synced: ' + (result.recordsSynced || 0));
    console.log('Errors: ' + (result.errors?.length || 0));

    // Verify what dates we now have
    const DailyMetrics = require('./models/DailyMetrics');
    
    console.log('\n=== Recent Dates After Sync ===');
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const metric = await DailyMetrics.findOne({
        userId: user._id,
        date: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lte: new Date(dateStr + 'T23:59:59.999Z')
        }
      });
      
      if (metric) {
        console.log(`✓ ${dateStr}: Rev=₹${metric.revenue || 0}, Orders=${metric.totalOrders || 0}, AdSpend=₹${(metric.adSpend || 0).toFixed(0)}`);
      } else {
        console.log(`✗ ${dateStr}: No data (no activity on this date)`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncLatest();
