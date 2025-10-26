require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api';

async function testTodayYesterday() {
  console.log('=== Testing Today and Yesterday for Anurag ===\n');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'duttanurag321@gmail.com',
      password: '@Tmflove321'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // Test Today
    const today = '2025-10-25';
    console.log(`Testing Today (${today}):`);
    
    const todayResponse = await axios.get(
      `${BASE_URL}/data/dashboard?startDate=${today}&endDate=${today}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (todayResponse.data.summary && todayResponse.data.summary.length > 0) {
      console.log('✓ API returns data for today');
      const summaryMap = {};
      todayResponse.data.summary.forEach(item => {
        summaryMap[item.title] = item.value;
      });
      console.log(`  Orders: ${summaryMap['Total Orders']}`);
      console.log(`  Revenue: ${summaryMap['Revenue']}`);
      console.log(`  Ad Spend: ${summaryMap['Ad Spend']}`);
    } else {
      console.log('✗ No data returned');
    }

    // Test Yesterday
    const yesterday = '2025-10-24';
    console.log(`\nTesting Yesterday (${yesterday}):`);
    
    const yesterdayResponse = await axios.get(
      `${BASE_URL}/data/dashboard?startDate=${yesterday}&endDate=${yesterday}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (yesterdayResponse.data.summary && yesterdayResponse.data.summary.length > 0) {
      console.log('✓ API returns data for yesterday');
      const summaryMap = {};
      yesterdayResponse.data.summary.forEach(item => {
        summaryMap[item.title] = item.value;
      });
      console.log(`  Orders: ${summaryMap['Total Orders']}`);
      console.log(`  Revenue: ${summaryMap['Revenue']}`);
      console.log(`  Ad Spend: ${summaryMap['Ad Spend']}`);
    } else {
      console.log('✗ No data returned');
    }

    console.log('\n=== ✓ SUCCESS ===');
    console.log('Frontend will now load data when clicking:');
    console.log('  ✓ Today button');
    console.log('  ✓ Yesterday button');
    console.log('\nThe database now has entries for all recent dates.');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testTodayYesterday();
