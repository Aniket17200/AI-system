require('dotenv').config();
const mongoose = require('mongoose');
const DataSyncService = require('./services/dataSyncService');

async function testShippingPreservation() {
  try {
    console.log('🧪 Testing Shipping Data Preservation\n');
    console.log('=' .repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const DailyMetrics = require('./models/DailyMetrics');
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    // Check shipping data before sync
    console.log('📊 BEFORE SYNC:\n');
    const beforeMetrics = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: new Date('2025-08-26'),
        $lte: new Date('2025-08-28')
      },
      totalShipments: { $gt: 0 }
    }).sort({ date: 1 });

    console.log(`Days with shipping data: ${beforeMetrics.length}\n`);
    beforeMetrics.forEach(m => {
      console.log(`${m.date.toISOString().split('T')[0]}: ${m.totalShipments} shipments, ${m.delivered} delivered`);
    });

    // Run sync (Shiprocket will fail/return 0 for 2025 dates)
    console.log('\n' + '=' .repeat(70));
    console.log('🔄 Running Sync...\n');

    const syncService = new DataSyncService();
    const result = await syncService.syncUserData(
      user,
      new Date('2025-08-26'),
      new Date('2025-08-28')
    );

    console.log(`\n✅ Sync completed: ${result.recordsSynced} records`);
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
    }

    // Check shipping data after sync
    console.log('\n' + '=' .repeat(70));
    console.log('📊 AFTER SYNC:\n');
    
    const afterMetrics = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: new Date('2025-08-26'),
        $lte: new Date('2025-08-28')
      },
      totalShipments: { $gt: 0 }
    }).sort({ date: 1 });

    console.log(`Days with shipping data: ${afterMetrics.length}\n`);
    afterMetrics.forEach(m => {
      console.log(`${m.date.toISOString().split('T')[0]}: ${m.totalShipments} shipments, ${m.delivered} delivered`);
    });

    // Compare
    console.log('\n' + '=' .repeat(70));
    console.log('📋 RESULT:\n');
    
    if (beforeMetrics.length === afterMetrics.length) {
      console.log('✅ Shipping data PRESERVED!');
      console.log('   Even though Shiprocket returned 0, existing data was kept.');
    } else {
      console.log('⚠️  Shipping data changed');
    }

    console.log('\n✅ Test complete!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testShippingPreservation();
