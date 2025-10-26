require('dotenv').config();
const axios = require('axios');

async function testCampaignNames() {
  try {
    console.log('🧪 Testing Campaign Names\n');

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Get marketing data
    const marketingResponse = await axios.get('http://localhost:6000/api/data/marketingData', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-07-27',
        endDate: '2025-07-27'
      }
    });

    const campaigns = marketingResponse.data.campaigns;
    
    console.log(`📊 Total campaigns: ${campaigns.length}\n`);
    console.log('First 10 campaign names:\n');
    
    campaigns.slice(0, 10).forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.campaignName}`);
      if (campaign.originalName) {
        console.log(`   Original: ${campaign.originalName}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCampaignNames();
