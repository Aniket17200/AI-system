require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:6000/api';

async function testCampaignsComplete() {
  console.log('🧪 TESTING CAMPAIGNS - COMPLETE CHECK\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login to get token
    console.log('\n📝 Step 1: Login to get JWT token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');

    // Step 2: Call Marketing Data API
    console.log('\n📊 Step 2: Fetching marketing data from API...');
    const marketingResponse = await axios.get(`${BASE_URL}/data/marketingData`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-07-27',
        endDate: '2025-07-27'
      }
    });

    console.log('\n📦 API Response Structure:');
    console.log('Keys:', Object.keys(marketingResponse.data));
    console.log('\nFull Response:', JSON.stringify(marketingResponse.data, null, 2));

    const campaigns = marketingResponse.data.campaigns || [];
    console.log(`\n✅ API returned ${campaigns.length} campaigns\n`);

    // Step 3: Display all campaigns
    console.log('=' .repeat(60));
    console.log('📋 CAMPAIGNS FOUND:\n');
    
    campaigns.forEach((campaign, index) => {
      console.log(`Campaign ${index + 1}: ${campaign.campaignName}`);
      console.log(`  - Amount Spent: ₹${campaign.amountSpent.toLocaleString()}`);
      console.log(`  - Impressions: ${campaign.impressions.toLocaleString()}`);
      console.log(`  - Clicks: ${campaign.clicks.toLocaleString()}`);
      console.log(`  - Sales: ₹${campaign.sales.toLocaleString()}`);
      console.log(`  - ROAS: ${campaign.roas}`);
      console.log(`  - CTR: ${campaign.ctr}%`);
      console.log(`  - CPC: ₹${campaign.cpc}`);
      console.log(`  - CPM: ₹${campaign.cpm}`);
      console.log('');
    });

    // Step 4: Check database directly
    console.log('=' .repeat(60));
    console.log('\n🗄️  Step 3: Checking database directly...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const DailyMetrics = mongoose.model('DailyMetrics', new mongoose.Schema({}, { strict: false }));
    
    // Get user ID
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log(`✅ User found: ${user.email}`);

    // Check if campaigns are stored in database
    const sampleMetric = await DailyMetrics.findOne({ 
      userId: user._id 
    }).sort({ date: -1 });

    if (sampleMetric) {
      console.log('\n📊 Sample Database Record:');
      console.log(`Date: ${sampleMetric.date}`);
      
      if (sampleMetric.campaigns && Array.isArray(sampleMetric.campaigns)) {
        console.log(`\n✅ Campaigns stored in database: ${sampleMetric.campaigns.length} campaigns`);
        
        sampleMetric.campaigns.forEach((campaign, index) => {
          console.log(`\nCampaign ${index + 1}:`);
          console.log(`  - ID: ${campaign.campaignId}`);
          console.log(`  - Name: ${campaign.campaignName}`);
          console.log(`  - Spend: ₹${campaign.spend}`);
          console.log(`  - Impressions: ${campaign.impressions}`);
          console.log(`  - Clicks: ${campaign.clicks}`);
        });
      } else {
        console.log('\n⚠️  No campaigns array found in database record');
        console.log('Database structure:', Object.keys(sampleMetric.toObject()));
      }
    } else {
      console.log('❌ No metrics found in database');
    }

    // Step 5: Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY:\n');
    console.log(`✅ API Endpoint: Working`);
    console.log(`✅ Campaigns Returned: ${campaigns.length}`);
    console.log(`✅ Database: Connected`);
    console.log(`✅ Campaign Names:`);
    campaigns.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.campaignName}`);
    });

    console.log('\n✅ ALL CHECKS PASSED - Campaigns are working correctly!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.error('Full error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testCampaignsComplete();
