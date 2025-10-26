require('dotenv').config();
const axios = require('axios');

async function test30DaysWithSpend() {
  console.log('🧪 Testing 30-Day Period WITH Ad Spend\n');

  try {
    // Test period: Aug 27 - Sept 26 (should have ad spend)
    const startDate = '2025-08-27';
    const endDate = '2025-09-26';

    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    const response = await axios.get('http://localhost:6000/api/data/marketingData', {
      headers: { Authorization: `Bearer ${token}` },
      params: { startDate, endDate }
    });

    const { summary, campaigns } = response.data;

    console.log('📊 Summary:');
    summary.forEach(([label, value]) => {
      console.log(`  ${label}: ${value}`);
    });

    console.log(`\n✅ Individual Campaigns: ${campaigns?.length || 0}`);
    
    if (campaigns && campaigns.length > 0) {
      console.log('\nFirst 10 campaigns:');
      campaigns.slice(0, 10).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.campaignName} - ₹${parseFloat(c.amountSpent).toLocaleString('en-IN')}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test30DaysWithSpend();
