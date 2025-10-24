require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function syncTanesh3Months() {
  try {
    console.log('🚀 Syncing 3 Months Data for Tanesh\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Connect to MongoDB to get user
    await mongoose.connect(process.env.MONGODB_URI);
    
    const taneshUser = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    if (!taneshUser) {
      console.log('❌ Tanesh user not found!');
      console.log('Run: npm run add:meta first\n');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Found Tanesh user');
    console.log('   User ID:', taneshUser._id);
    console.log('   Email:', taneshUser.email);
    console.log('   Shopify Store:', taneshUser.shopifyStore || '❌ Not set');
    console.log('   Meta Token:', taneshUser.metaAccessToken ? '✅ Set' : '❌ Not set');
    console.log('   Shiprocket:', taneshUser.shiprocketEmail ? '✅ Set' : '❌ Not set');
    console.log('\n');

    await mongoose.disconnect();

    // Calculate date range (last 3 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    console.log('📅 Date Range:');
    console.log('   Start:', startDate.toISOString().split('T')[0]);
    console.log('   End:', endDate.toISOString().split('T')[0]);
    console.log('\n');

    // Sync data
    console.log('🔄 Starting sync...\n');
    
    const syncResponse = await axios.post(`${API_BASE}/sync/manual`, {
      userId: taneshUser._id.toString(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    console.log('✅ Sync completed!');
    console.log('   Records synced:', syncResponse.data.data.recordsSynced);
    console.log('   Errors:', syncResponse.data.data.errors.length);
    
    if (syncResponse.data.data.errors.length > 0) {
      console.log('\n   ⚠️  Errors:');
      syncResponse.data.data.errors.forEach(err => console.log('      -', err));
    }
    console.log('\n');

    // Get summary
    console.log('📊 Fetching summary...\n');
    const summaryResponse = await axios.get(`${API_BASE}/metrics/summary/${taneshUser._id}?days=90`);
    const metrics = summaryResponse.data.data;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   TANESH - 3 MONTH SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('   📦 SHOPIFY DATA:');
    console.log('   Total Orders:', metrics.totalOrders);
    console.log('   Revenue: ₹', metrics.revenue.toLocaleString('en-IN'));
    console.log('   COGS: ₹', metrics.cogs.toLocaleString('en-IN'));
    console.log('   Gross Profit: ₹', metrics.grossProfit.toLocaleString('en-IN'), `(${metrics.grossProfitMargin.toFixed(2)}%)`);
    console.log('\n   📢 META ADS DATA:');
    console.log('   Ad Spend: ₹', metrics.adSpend.toLocaleString('en-IN'));
    console.log('   ROAS:', metrics.roas.toFixed(2) + 'x');
    console.log('   POAS:', metrics.poas.toFixed(2) + 'x');
    console.log('\n   🚚 SHIPROCKET DATA:');
    console.log('   Shipping Cost: ₹', metrics.shippingCost.toLocaleString('en-IN'));
    console.log('\n   💰 NET PROFIT:');
    console.log('   Net Profit: ₹', metrics.netProfit.toLocaleString('en-IN'), `(${metrics.netProfitMargin.toFixed(2)}%)`);
    console.log('   AOV: ₹', metrics.aov.toLocaleString('en-IN'));
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    console.log('✅ Tanesh data synced successfully!\n');
    console.log('User ID:', taneshUser._id);
    console.log('\nVerify with: npm run verify:db\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:5000/');
    return true;
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('Please start: npm run dev\n');
    return false;
  }
}

(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await syncTanesh3Months();
  }
})();
