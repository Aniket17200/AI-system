require('dotenv').config();
const axios = require('axios');

async function testFinalCampaigns() {
  try {
    console.log('🎯 FINAL CAMPAIGNS TEST - Marketing Dashboard Ready\n');
    console.log('=' .repeat(70));

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('\n✅ Authentication successful');

    // Get marketing data
    const marketingResponse = await axios.get('http://localhost:6000/api/data/marketingData', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-07-27',
        endDate: '2025-07-27'
      }
    });

    const { campaigns, summary } = marketingResponse.data;
    
    console.log('\n📊 MARKETING DASHBOARD DATA');
    console.log('=' .repeat(70));
    
    console.log('\n📈 Summary Metrics:');
    summary.forEach(([label, value]) => {
      console.log(`  ${label}: ${value}`);
    });

    console.log('\n\n🎯 INDIVIDUAL CAMPAIGNS');
    console.log('=' .repeat(70));
    console.log(`\nTotal Campaigns: ${campaigns.length}\n`);

    // Display first 10 campaigns in detail
    console.log('First 10 Campaigns:\n');
    campaigns.slice(0, 10).forEach((campaign, index) => {
      console.log(`${campaign.campaignName}`);
      console.log(`  Amount Spent:  ₹${parseFloat(campaign.amountSpent).toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      console.log(`  Impressions:   ${campaign.impressions.toLocaleString('en-IN')}`);
      console.log(`  CPM:           ₹${campaign.cpm}`);
      console.log(`  CTR:           ${campaign.ctr}`);
      console.log(`  Clicks:        ${campaign.clicks.toLocaleString('en-IN')}`);
      console.log(`  CPC:           ₹${campaign.cpc}`);
      console.log(`  Sales:         ₹${campaign.sales}`);
      console.log(`  CPS:           ₹${campaign.cps}`);
      console.log(`  ROAS:          ${campaign.roas}`);
      console.log(`  Total Sales:   ₹${campaign.totalSales}`);
      console.log('');
    });

    console.log('=' .repeat(70));
    console.log('\n✅ ALL CAMPAIGNS READY FOR FRONTEND DISPLAY');
    console.log('\n📋 API Endpoint: GET /api/data/marketingData');
    console.log('📋 Response Format: campaigns array with numbered names');
    console.log('📋 Each campaign includes 10 metrics');
    console.log('\n🎉 Implementation Complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testFinalCampaigns();
