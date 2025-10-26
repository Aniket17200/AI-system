require('dotenv').config();
const mongoose = require('mongoose');
const DataSyncService = require('./services/dataSyncService');

async function syncWithShiprocketFix() {
  try {
    console.log('🔄 Syncing Data with Fixed Shiprocket\n');
    console.log('=' .repeat(70));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    console.log(`✅ Found user: ${user.email}\n`);

    const syncService = new DataSyncService();
    
    // Sync October data with fixed Shiprocket parsing
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-25');

    console.log(`📅 Syncing: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    const result = await syncService.syncUserData(user, startDate, endDate);

    console.log('\n' + '=' .repeat(70));
    console.log('✅ Sync completed!\n');
    console.log(`📊 Records synced: ${result.recordsSynced}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Check shipping data
    const DailyMetrics = require('./models/DailyMetrics');
    const metricsWithShipping = await DailyMetrics.find({ 
      userId: user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      totalShipments: { $gt: 0 }
    }).sort({ date: 1 });

    console.log(`\n✅ Days with shipping data: ${metricsWithShipping.length}`);
    
    if (metricsWithShipping.length > 0) {
      console.log('\nSample days:');
      metricsWithShipping.slice(0, 5).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - Shipments: ${m.totalShipments}, Delivered: ${m.delivered}, RTO: ${m.rto}`);
      });
    } else {
      console.log('\n⚠️  No shipping data found in database');
    }

    console.log('\n✅ Shiprocket data sync complete!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

syncWithShiprocketFix();
