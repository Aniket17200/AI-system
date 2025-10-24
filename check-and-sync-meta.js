require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function checkAndSyncMeta() {
  try {
    console.log('🔍 Checking Meta Ads Credentials in Database\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} user(s) in database\n`);

    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 User: ${user.email}`);
      console.log(`   User ID: ${user._id}`);
      console.log('   ─────────────────────────────────────────────────────────');
      console.log('   📦 SHOPIFY:');
      console.log(`      Store: ${user.shopifyStore || '❌ Not set'}`);
      console.log(`      Token: ${user.shopifyAccessToken ? '✅ Set (' + user.shopifyAccessToken.substring(0, 20) + '...)' : '❌ Not set'}`);
      console.log('   ─────────────────────────────────────────────────────────');
      console.log('   📢 META ADS:');
      console.log(`      Token: ${user.metaAccessToken ? '✅ Set (' + user.metaAccessToken.substring(0, 20) + '...)' : '❌ Not set'}`);
      console.log(`      Account ID: ${user.metaAdAccountId || '❌ Not set'}`);
      console.log('   ─────────────────────────────────────────────────────────');
      console.log('   🚚 SHIPROCKET:');
      console.log(`      Email: ${user.shiprocketEmail || '❌ Not set'}`);
      console.log(`      Password: ${user.shiprocketPassword ? '✅ Set' : '❌ Not set'}`);
      console.log('   ─────────────────────────────────────────────────────────');
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Last Sync: ${user.lastSyncAt || 'Never'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // If user has Meta credentials, test them
      if (user.metaAccessToken && user.metaAdAccountId) {
        console.log(`🧪 Testing Meta Ads API for ${user.email}...\n`);
        
        try {
          const testDate = new Date();
          testDate.setDate(testDate.getDate() - 7); // Last 7 days
          
          const metaResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${user.metaAdAccountId}/insights`,
            {
              params: {
                access_token: user.metaAccessToken,
                time_range: JSON.stringify({
                  since: testDate.toISOString().split('T')[0],
                  until: new Date().toISOString().split('T')[0]
                }),
                fields: 'spend,reach,impressions,clicks',
                level: 'account',
                time_increment: 1
              }
            }
          );

          console.log('✅ Meta Ads API Test Successful!');
          console.log(`   Found ${metaResponse.data.data.length} days of ad data\n`);
          
          if (metaResponse.data.data.length > 0) {
            console.log('   Sample Data (Last 3 Days):');
            metaResponse.data.data.slice(0, 3).forEach((day, i) => {
              console.log(`   ${i + 1}. Date: ${day.date_start}`);
              console.log(`      Spend: ₹${parseFloat(day.spend || 0).toFixed(2)}`);
              console.log(`      Reach: ${day.reach || 0}`);
              console.log(`      Impressions: ${day.impressions || 0}`);
              console.log(`      Clicks: ${day.clicks || 0}`);
            });
            console.log('');
          }

          // Trigger sync for this user
          console.log(`🔄 Syncing 3 months of data for ${user.email}...\n`);
          
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);

          const syncResponse = await axios.post(`${API_BASE}/sync/manual`, {
            userId: user._id.toString(),
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          });

          console.log('✅ Sync completed!');
          console.log(`   Records synced: ${syncResponse.data.data.recordsSynced}`);
          console.log(`   Errors: ${syncResponse.data.data.errors.length}`);
          
          if (syncResponse.data.data.errors.length > 0) {
            console.log('\n   ⚠️  Errors:');
            syncResponse.data.data.errors.forEach(err => console.log(`      - ${err}`));
          }
          console.log('\n');

        } catch (error) {
          console.log('❌ Meta Ads API Test Failed!');
          console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
          console.log('   This might mean:');
          console.log('   - Token is expired');
          console.log('   - Account ID is incorrect');
          console.log('   - No ad campaigns in date range');
          console.log('   - Insufficient permissions\n');
        }
      } else {
        console.log(`⚠️  Meta Ads credentials not set for ${user.email}`);
        console.log('   Add them using:');
        console.log(`   curl -X PUT http://localhost:5000/api/users/${user._id} \\`);
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"metaAccessToken":"YOUR_TOKEN","metaAdAccountId":"act_YOUR_ID"}\'\n');
      }
    }

    await mongoose.disconnect();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Check Complete!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. If Meta Ads credentials are set and working, data is now synced');
    console.log('2. Run: npm run verify:db to see the data');
    console.log('3. System will auto-sync every hour\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
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
    await checkAndSyncMeta();
  }
})();
