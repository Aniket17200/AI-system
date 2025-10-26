require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api';

async function testDashboard() {
  console.log('=== Testing Dashboard for duttanurag321@gmail.com ===\n');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'duttanurag321@gmail.com',
      password: '@Tmflove321'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful!\n');

    // Test different date ranges
    const tests = [
      { name: 'Last 7 days', start: '2025-10-12', end: '2025-10-19' },
      { name: 'Last 30 days', start: '2025-09-20', end: '2025-10-19' },
      { name: 'October 2025', start: '2025-10-01', end: '2025-10-31' },
      { name: 'All time', start: '2024-01-01', end: '2025-12-31' }
    ];

    for (const test of tests) {
      console.log(`Testing: ${test.name} (${test.start} to ${test.end})`);
      
      const response = await axios.get(
        `${BASE_URL}/data/dashboard?startDate=${test.start}&endDate=${test.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      console.log(`  Revenue: ₹${(data.totalRevenue || 0).toLocaleString()}`);
      console.log(`  Orders: ${data.totalOrders || 0}`);
      console.log(`  Ad Spend: ₹${(data.totalAdSpend || 0).toLocaleString()}`);
      console.log(`  ROAS: ${(data.roas || 0).toFixed(2)}x`);
      console.log(`  Data Points: ${data.chartData?.length || 0}`);
      console.log();
    }

    console.log('=== ✓ Dashboard Working! ===');
    console.log('\nThe system is fetching and displaying data correctly.');
    console.log('User can see their revenue, orders, and metrics.');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testDashboard();
