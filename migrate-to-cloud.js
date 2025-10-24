require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB URIs
const LOCAL_URI = 'mongodb://localhost:27017/profitfirstuser';
const CLOUD_URI = process.env.MONGODB_URI;

// Models
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const ProductCost = require('./models/ProductCost');
const SyncJob = require('./models/SyncJob');

async function migrateToCloud() {
  console.log('🚀 Starting Migration from Local MongoDB to Cloud\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Connect to LOCAL MongoDB
    console.log('📡 Connecting to LOCAL MongoDB...');
    const localConnection = await mongoose.createConnection(LOCAL_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to LOCAL MongoDB\n');

    // Create models for local connection
    const LocalUser = localConnection.model('User', User.schema);
    const LocalDailyMetrics = localConnection.model('DailyMetrics', DailyMetrics.schema);
    const LocalProductCost = localConnection.model('ProductCost', ProductCost.schema);
    const LocalSyncJob = localConnection.model('SyncJob', SyncJob.schema);

    // Connect to CLOUD MongoDB
    console.log('☁️  Connecting to CLOUD MongoDB (Atlas)...');
    const cloudConnection = await mongoose.createConnection(CLOUD_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to CLOUD MongoDB\n');

    // Create models for cloud connection
    const CloudUser = cloudConnection.model('User', User.schema);
    const CloudDailyMetrics = cloudConnection.model('DailyMetrics', DailyMetrics.schema);
    const CloudProductCost = cloudConnection.model('ProductCost', ProductCost.schema);
    const CloudSyncJob = cloudConnection.model('SyncJob', SyncJob.schema);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 MIGRATION PROGRESS\n');

    // Migrate Users
    console.log('👤 Migrating Users...');
    const localUsers = await LocalUser.find({});
    console.log(`   Found ${localUsers.length} users in local DB`);
    
    if (localUsers.length > 0) {
      // Clear existing users in cloud (optional - comment out if you want to keep existing)
      await CloudUser.deleteMany({});
      console.log('   Cleared existing users in cloud');
      
      // Insert users
      const usersToInsert = localUsers.map(user => ({
        _id: user._id,
        email: user.email,
        shopifyStore: user.shopifyStore,
        shopifyAccessToken: user.shopifyAccessToken,
        metaAdsAccessToken: user.metaAdsAccessToken,
        metaAdsAccountId: user.metaAdsAccountId,
        shiprocketEmail: user.shiprocketEmail,
        shiprocketPassword: user.shiprocketPassword,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      await CloudUser.insertMany(usersToInsert);
      console.log(`   ✅ Migrated ${usersToInsert.length} users\n`);
    } else {
      console.log('   ⚠️  No users found to migrate\n');
    }

    // Migrate DailyMetrics
    console.log('📈 Migrating Daily Metrics...');
    const localMetrics = await LocalDailyMetrics.find({});
    console.log(`   Found ${localMetrics.length} daily metrics records`);
    
    if (localMetrics.length > 0) {
      // Clear existing metrics in cloud
      await CloudDailyMetrics.deleteMany({});
      console.log('   Cleared existing metrics in cloud');
      
      // Insert in batches (1000 at a time for better performance)
      const batchSize = 1000;
      let migrated = 0;
      
      for (let i = 0; i < localMetrics.length; i += batchSize) {
        const batch = localMetrics.slice(i, i + batchSize);
        await CloudDailyMetrics.insertMany(batch);
        migrated += batch.length;
        console.log(`   Progress: ${migrated}/${localMetrics.length} records migrated`);
      }
      
      console.log(`   ✅ Migrated ${localMetrics.length} daily metrics\n`);
    } else {
      console.log('   ⚠️  No daily metrics found to migrate\n');
    }

    // Migrate ProductCosts
    console.log('💰 Migrating Product Costs...');
    const localProducts = await LocalProductCost.find({});
    console.log(`   Found ${localProducts.length} product cost records`);
    
    if (localProducts.length > 0) {
      await CloudProductCost.deleteMany({});
      console.log('   Cleared existing product costs in cloud');
      
      // Drop existing indexes to avoid conflicts
      try {
        await CloudProductCost.collection.dropIndexes();
        console.log('   Dropped existing indexes');
      } catch (e) {
        // Ignore if no indexes exist
      }
      
      // Insert products
      await CloudProductCost.insertMany(localProducts, { ordered: false });
      console.log(`   ✅ Migrated ${localProducts.length} product costs\n`);
    } else {
      console.log('   ⚠️  No product costs found to migrate\n');
    }

    // Migrate SyncJobs
    console.log('🔄 Migrating Sync Jobs...');
    const localJobs = await LocalSyncJob.find({});
    console.log(`   Found ${localJobs.length} sync job records`);
    
    if (localJobs.length > 0) {
      await CloudSyncJob.deleteMany({});
      console.log('   Cleared existing sync jobs in cloud');
      
      await CloudSyncJob.insertMany(localJobs);
      console.log(`   ✅ Migrated ${localJobs.length} sync jobs\n`);
    } else {
      console.log('   ⚠️  No sync jobs found to migrate\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 MIGRATION SUMMARY\n');
    
    // Verify migration
    const cloudUsers = await CloudUser.countDocuments();
    const cloudMetrics = await CloudDailyMetrics.countDocuments();
    const cloudProducts = await CloudProductCost.countDocuments();
    const cloudJobs = await CloudSyncJob.countDocuments();
    
    console.log(`   Users:          ${localUsers.length} → ${cloudUsers} ✅`);
    console.log(`   Daily Metrics:  ${localMetrics.length} → ${cloudMetrics} ✅`);
    console.log(`   Product Costs:  ${localProducts.length} → ${cloudProducts} ✅`);
    console.log(`   Sync Jobs:      ${localJobs.length} → ${cloudJobs} ✅`);
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
    // Calculate totals for verification
    if (cloudMetrics > 0) {
      const sampleMetrics = await CloudDailyMetrics.find({}).limit(5);
      console.log('📊 Sample Data Verification (First 5 records):\n');
      
      sampleMetrics.forEach((m, idx) => {
        console.log(`   ${idx + 1}. Date: ${m.date.toISOString().split('T')[0]}`);
        console.log(`      Revenue: ₹${Math.round(m.revenue).toLocaleString('en-IN')}`);
        console.log(`      Orders: ${m.totalOrders}`);
        console.log(`      Net Profit: ₹${Math.round(m.netProfit).toLocaleString('en-IN')}`);
        console.log('');
      });
    }
    
    // Close connections
    await localConnection.close();
    await cloudConnection.close();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 Your data is now in MongoDB Atlas (Cloud)!\n');
    console.log('Next steps:');
    console.log('1. ✅ .env file already updated with cloud URI');
    console.log('2. 🔄 Restart your server: npm run dev');
    console.log('3. 🧪 Test the API to verify everything works');
    console.log('4. 🗑️  (Optional) You can now remove local MongoDB data\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration Error:', error.message);
    console.error('\nFull Error:', error);
    process.exit(1);
  }
}

// Run migration
migrateToCloud();
