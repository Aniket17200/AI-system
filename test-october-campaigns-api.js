require('dotenv').config();
const axios = require('axios');

async function testOctoberCampaignsAPI() {
  try {
    console.log('🧪 Testing October Campaigns via API\n');

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test October 1st (should have campaigns)
    console.log('📅 Testing: October 1, 2025\n');
    
    const response = await axios.get('http://localhost:6000/api/data/marketingData', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-10-01',
        endDate: '2025-10-01'
      }
    });

    const { summary, campaigns } = response.data;

    console.log('📊 Summary:');
    summary.forEach(([label, value]) => {
      console.log(`  ${label}: ${value}`);
    });

    console.log(`\n✅ Individual Campaigns: ${campaigns?.length || 0}\n`);

    if (campaigns && campaigns.length > 0) {
      console.log('First 10 campaigns:');
      campaigns.slice(0, 10).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.campaignName} - ₹${parseFloat(c.amountSpent).toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      });
      
      console.log('\n✅ SUCCESS! Campaigns are now available via API');
      console.log('   Frontend will display these campaigns');
    } else {
      console.log('⚠️  No campaigns in API response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testOctoberCampaignsAPI();
