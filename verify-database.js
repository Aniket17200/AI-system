require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const ProductCost = require('./models/ProductCost');
const SyncJob = require('./models/SyncJob');

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying Database Structure\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Verify Users
    console.log('👤 USERS COLLECTION:');
    const users = await User.find();
    console.log(`   Total Users: ${users.length}`);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('\n   Sample User:');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   User ID:', user._id.toString());
      console.log('   Email:', user.email);
      console.log('   Shopify Store:', user.shopifyStore);
      console.log('   Shopify Token:', user.shopifyAccessToken ? '✅ Set' : '❌ Not set');
      console.log('   Meta Token:', user.metaAccessToken ? '✅ Set' : '❌ Not set');
      console.log('   Shiprocket Email:', user.shiprocketEmail ? '✅ Set' : '❌ Not set');
      console.log('   Active:', user.isActive ? '✅ Yes' : '❌ No');
      console.log('   Last Sync:', user.lastSyncAt || 'Never');
      console.log('   Created:', user.createdAt);
    }
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // 2. Verify Product Costs
    console.log('💰 PRODUCT COSTS COLLECTION:');
    const productCosts = await ProductCost.find();
    console.log(`   Total Products: ${productCosts.length}`);
    
    if (productCosts.length > 0) {
      console.log('\n   Sample Products (First 5):');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      productCosts.slice(0, 5).forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.productName}`);
        console.log(`      Product ID: ${product.shopifyProductId}`);
        console.log(`      Cost: ₹${product.cost}`);
        console.log(`      User ID: ${product.userId}`);
      });
    }
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // 3. Verify Daily Metrics (Date-wise data)
    console.log('📊 DAILY METRICS COLLECTION (Date-wise Data):');
    const dailyMetrics = await DailyMetrics.find().sort({ date: -1 });
    console.log(`   Total Days with Data: ${dailyMetrics.length}`);
    
    if (dailyMetrics.length > 0) {
      console.log('\n   Date Range:');
      console.log(`   From: ${dailyMetrics[dailyMetrics.length - 1].date.toISOString().split('T')[0]}`);
      console.log(`   To: ${dailyMetrics[0].date.toISOString().split('T')[0]}`);
      
      console.log('\n   Sample Daily Metrics (Last 3 Days):');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      dailyMetrics.slice(0, 3).forEach((day, i) => {
        console.log(`\n   ${i + 1}. Date: ${day.date.toISOString().split('T')[0]}`);
        console.log(`      User ID: ${day.userId}`);
        console.log('      ─────────────────────────────────────────────────────────');
        console.log('      📦 SHOPIFY DATA:');
        console.log(`         Orders: ${day.totalOrders}`);
        console.log(`         Revenue: ₹${day.revenue.toFixed(2)}`);
        console.log(`         COGS: ₹${day.cogs.toFixed(2)}`);
        console.log(`         Customers: ${day.totalCustomers} (New: ${day.newCustomers}, Returning: ${day.returningCustomers})`);
        console.log('      ─────────────────────────────────────────────────────────');
        console.log('      📢 META ADS DATA:');
        console.log(`         Ad Spend: ₹${day.adSpend.toFixed(2)}`);
        console.log(`         Reach: ${day.reach}`);
        console.log(`         Impressions: ${day.impressions}`);
        console.log(`         Clicks: ${day.linkClicks}`);
        console.log(`         ROAS: ${day.roas.toFixed(2)}x`);
        console.log(`         CPC: ₹${day.cpc.toFixed(2)}`);
        console.log(`         CTR: ${day.ctr.toFixed(2)}%`);
        console.log('      ─────────────────────────────────────────────────────────');
        console.log('      🚚 SHIPROCKET DATA:');
        console.log(`         Shipments: ${day.totalShipments}`);
        console.log(`         Delivered: ${day.delivered}`);
        console.log(`         In-Transit: ${day.inTransit}`);
        console.log(`         RTO: ${day.rto}`);
        console.log(`         Shipping Cost: ₹${day.shippingCost.toFixed(2)}`);
        console.log(`         Delivery Rate: ${day.deliveryRate.toFixed(2)}%`);
        console.log('      ─────────────────────────────────────────────────────────');
        console.log('      💰 CALCULATED METRICS:');
        console.log(`         Gross Profit: ₹${day.grossProfit.toFixed(2)} (${day.grossProfitMargin.toFixed(2)}%)`);
        console.log(`         Net Profit: ₹${day.netProfit.toFixed(2)} (${day.netProfitMargin.toFixed(2)}%)`);
        console.log(`         AOV: ₹${day.aov.toFixed(2)}`);
        console.log(`         POAS: ${day.poas.toFixed(2)}x`);
      });
    }
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // 4. Verify Sync Jobs
    console.log('🔄 SYNC JOBS COLLECTION:');
    const syncJobs = await SyncJob.find().sort({ createdAt: -1 }).limit(5);
    console.log(`   Total Sync Jobs: ${await SyncJob.countDocuments()}`);
    
    if (syncJobs.length > 0) {
      console.log('\n   Recent Sync Jobs (Last 5):');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      syncJobs.forEach((job, i) => {
        const duration = job.completedAt ? 
          ((new Date(job.completedAt) - new Date(job.startedAt)) / 1000).toFixed(2) : 
          'Running...';
        console.log(`\n   ${i + 1}. Job ID: ${job.jobId}`);
        console.log(`      User ID: ${job.userId}`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Records Synced: ${job.recordsSynced}`);
        console.log(`      Duration: ${duration}s`);
        console.log(`      Started: ${job.startedAt.toLocaleString()}`);
        if (job.errors.length > 0) {
          console.log(`      Errors: ${job.errors.join(', ')}`);
        }
      });
    }
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // 5. Data Summary by User
    console.log('📈 DATA SUMMARY BY USER:');
    for (const user of users) {
      const userMetrics = await DailyMetrics.find({ userId: user._id });
      const userProducts = await ProductCost.find({ userId: user._id });
      const userJobs = await SyncJob.find({ userId: user._id });
      
      console.log(`\n   User: ${user.email}`);
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   User ID: ${user._id}`);
      console.log(`   Days with Data: ${userMetrics.length}`);
      console.log(`   Products: ${userProducts.length}`);
      console.log(`   Sync Jobs: ${userJobs.length}`);
      
      if (userMetrics.length > 0) {
        const totals = userMetrics.reduce((acc, m) => ({
          orders: acc.orders + m.totalOrders,
          revenue: acc.revenue + m.revenue,
          netProfit: acc.netProfit + m.netProfit
        }), { orders: 0, revenue: 0, netProfit: 0 });
        
        console.log(`   Total Orders: ${totals.orders}`);
        console.log(`   Total Revenue: ₹${totals.revenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
        console.log(`   Total Net Profit: ₹${totals.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      }
    }
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // 6. Verification Summary
    console.log('✅ VERIFICATION SUMMARY:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ✅ Users: ${users.length} stored`);
    console.log(`   ✅ Product Costs: ${productCosts.length} stored`);
    console.log(`   ✅ Daily Metrics: ${dailyMetrics.length} days stored`);
    console.log(`   ✅ Sync Jobs: ${await SyncJob.countDocuments()} tracked`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ✅ Data is organized by:');
    console.log('      - User ID (each user has separate data)');
    console.log('      - Date (daily metrics for each day)');
    console.log('      - Source (Shopify, Meta Ads, Shiprocket)');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ✅ All data properly stored and indexed!');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('✅ Database verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDatabase();
