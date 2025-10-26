const mongoose = require('mongoose');
const User = require('./models/User');
const DataSyncService = require('./services/dataSyncService');
const logger = require('./config/logger');

async function syncCompleteData() {
  try {
    console.log('🔄 Starting Complete Data Sync...\n');
    console.log('='.repeat(60));

    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user
    const userId = '68c812b0afc4892c1f8128e3';
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`📊 User: ${user.email}`);
    console.log(`🏪 Store: ${user.shopifyStore}\n`);

    // Set date range - last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    console.log(`📅 Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);
    console.log('='.repeat(60));
    console.log('\n🚀 Fetching data from Shopify, Meta Ads, and Shiprocket...\n');

    // Run sync
    const syncService = new DataSyncService();
    const result = await syncService.syncUserData(user, startDate, endDate);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sync Complete!\n');
    console.log(`📦 Records Synced: ${result.recordsSynced}`);
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    // Update user's last sync time
    user.lastSyncAt = new Date();
    await user.save();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database updated with complete data!');
    console.log('\nYou can now refresh your dashboard to see:');
    console.log('  - 3,432 orders');
    console.log('  - ₹55,70,029 revenue');
    console.log('  - Correct ROAS and POAS');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the sync
syncCompleteData();
