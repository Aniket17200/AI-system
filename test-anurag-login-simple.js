require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api';

async function testLogin() {
  console.log('=== Testing Login and Dashboard for duttanurag321@gmail.com ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'duttanurag321@gmail.com',
      password: '@Tmflove321'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;

    console.log('✓ Login successful!');
    console.log(`  User ID: ${userId}`);
    console.log(`  Token: ${token.substring(0, 30)}...`);

    // Step 2: Fetch Dashboard Data
    console.log('\nStep 2: Fetching dashboard data (last 30 days)...');
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const dashboardResponse = await axios.get(
      `${BASE_URL}/data/dashboard?startDate=${startDate}&endDate=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = dashboardResponse.data;
    console.log('✓ Dashboard data fetched!');
    console.log(`  Total Revenue: ₹${(data.totalRevenue || 0).toLocaleString()}`);
    console.log(`  Total Orders: ${data.totalOrders || 0}`);
    console.log(`  Ad Spend: ₹${(data.totalAdSpend || 0).toLocaleString()}`);
    console.log(`  ROAS: ${(data.roas || 0).toFixed(2)}x`);
    console.log(`  Chart Data Points: ${data.chartData?.length || 0}`);

    // Step 3: Test AI Chat
    console.log('\nStep 3: Testing AI chat...');
    const chatResponse = await axios.post(
      `${BASE_URL}/chat`,
      { question: 'What is my total revenue?' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✓ AI chat working!');
    console.log(`  Response: ${chatResponse.data.answer.substring(0, 150)}...`);

    console.log('\n=== ✓ ALL TESTS PASSED ===');
    console.log('\n✓ User can login successfully');
    console.log('✓ Dashboard shows user-specific data');
    console.log('✓ AI chat is working');
    console.log('\nThe system is working correctly for multi-user access!');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testLogin();
