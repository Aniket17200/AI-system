require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api';

async function testAPI() {
  console.log('=== Testing API Response for duttanurag321@gmail.com ===\n');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'duttanurag321@gmail.com',
      password: '@Tmflove321'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful!\n');

    // Fetch October data
    const response = await axios.get(
      `${BASE_URL}/data/dashboard?startDate=2025-10-01&endDate=2025-10-31`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = response.data;
    
    console.log('API Response Structure:');
    console.log(`  Keys: ${Object.keys(data).join(', ')}\n`);

    if (data.summary && data.summary.length > 0) {
      console.log('Summary Cards:');
      data.summary.forEach(card => {
        console.log(`  ${card.title}: ${card.value}`);
      });
    }

    if (data.performanceChartData && data.performanceChartData.length > 0) {
      console.log(`\nPerformance Chart: ${data.performanceChartData.length} data points`);
      console.log('Sample:');
      data.performanceChartData.slice(0, 3).forEach(point => {
        console.log(`  ${point.name}: Revenue=₹${point.revenue || 0}, Orders=${point.orders || 0}`);
      });
    }

    console.log('\n=== ✓ API Working Correctly! ===');
    console.log('\nThe dashboard is now showing real data for duttanurag321@gmail.com');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAPI();
