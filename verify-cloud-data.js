require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const ProductCost = require('./models/ProductCost');
const SyncJob = require('./models/SyncJob');

async function verifyCloudData() {
  console.log('\n🔍 VERIFYING MONGODB ATLAS DATA\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Connect
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📂 Database:', dbName);
    console.log('🌐 Cluster:', process.env.MONGODB_URI.split('@')[1].split('/')[0]);
    console.log('');

    // Count documents
    console.log('📊 DOCUMENT COUNTS:\n');
    
    const userCount = await User.countDocuments();
    console.log('   👤 Users:', userCount);
    
    const metricsCount = await DailyMetrics.countDocuments();
    console.log('   📈 Daily Metrics:', metricsCount);
    
    const productsCount = await ProductCost.countDocuments();
    console.log('   💰 Product Costs:', productsCount);
    
    const jobsCount = await SyncJob.countDocuments();
    console.log('   🔄 Sync Jobs:', jobsCount);
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Show users
    if (userCount > 0) {
      console.log('👤 USERS:\n');
      const users = await User.find({}).select('email shopifyStore _id');
      users.forEach((u, idx) => {
        console.log(`   ${idx + 1}. ${u.email}`);
        console.log(`      ID: ${u._id}`);
        console.log(`      Store: ${u.shopifyStore || 'N/A'}`);
        console.log('');
      });
    }

    // Show sample metrics
    if (metricsCount > 0) {
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📈 SAMPLE DAILY METRICS (Latest 5):\n');
      
      const sampleMetrics = await DailyMetrics.find({})
        .sort({ date: -1 })
        .limit(5)
        .populate('userId', 'email');
      
      sampleMetrics.forEach((m, idx) => {
        console.log(`   ${idx + 1}. Date: ${m.date.toISOString().split('T')[0]}`);
        console.log(`      User: ${m.userId?.email || m.userId}`);
        console.log(`      Revenue: ₹${Math.round(m.revenue).toLocaleString('en-IN')}`);
        console.log(`      Orders: ${m.totalOrders}`);
        console.log(`      Net Profit: ₹${Math.round(m.netProfit).toLocaleString('en-IN')}`);
        console.log('');
      });
    }

    // Calculate totals per user
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 USER STATISTICS:\n');
    
    const users = await User.find({});
    for (const user of users) {
      const userMetrics = await DailyMetrics.find({ userId: user._id });
      
      if (userMetrics.length > 0) {
        const totalRevenue = userMetrics.reduce((sum, m) => sum + m.revenue, 0);
        const totalOrders = userMetrics.reduce((sum, m) => sum + m.totalOrders, 0);
        const totalProfit = userMetrics.reduce((sum, m) => sum + m.netProfit, 0);
        
        console.log(`   ${user.email}:`);
        console.log(`   - Records: ${userMetrics.length} days`);
        console.log(`   - Total Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
        console.log(`   - Total Orders: ${totalOrders}`);
        console.log(`   - Total Profit: ₹${Math.round(totalProfit).toLocaleString('en-IN')}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Summary
    const hasData = userCount > 0 && metricsCount > 0;
    
    if (hasData) {
      console.log('✅ DATA VERIFICATION: SUCCESS\n');
      console.log('   ✅ Users found:', userCount);
      console.log('   ✅ Metrics found:', metricsCount);
      console.log('   ✅ Products found:', productsCount);
      console.log('   ✅ Jobs found:', jobsCount);
      console.log('\n🎉 Your data is successfully stored in MongoDB Atlas!\n');
      console.log('📍 To view in Atlas Dashboard:');
      console.log('   1. Go to: https://cloud.mongodb.com');
      console.log('   2. Select Cluster0');
      console.log('   3. Click "Browse Collections"');
      console.log('   4. Select database: "' + dbName + '"');
      console.log('   5. View your collections\n');
    } else {
      console.log('⚠️  DATA VERIFICATION: NO DATA FOUND\n');
      console.log('   Run migration again: node migrate-to-cloud.js\n');
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

verifyCloudData();
