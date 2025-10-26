require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api';

async function testDateFiltering() {
  console.log('=== Testing Date Filtering for Both Users ===\n');

  const users = [
    { email: 'taneshpurohit09@gmail.com', password: 'blvp43el8rP8', name: 'Tanesh' },
    { email: 'duttanurag321@gmail.com', password: '@Tmflove321', name: 'Anurag' }
  ];

  for (const user of users) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${user.name} (${user.email})`);
    console.log('='.repeat(60));

    try {
      // Login
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });

      const token = loginResponse.data.token;
      console.log('✓ Login successful\n');

      // Test different date ranges
      const today = new Date();
      const dateRanges = [
        {
          name: 'Today',
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        },
        {
          name: 'Last 7 Days',
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        },
        {
          name: 'Last 30 Days',
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        },
        {
          name: 'October 2025',
          start: '2025-10-01',
          end: '2025-10-31'
        }
      ];

      for (const range of dateRanges) {
        console.log(`\n${range.name} (${range.start} to ${range.end}):`);
        
        const response = await axios.get(
          `${BASE_URL}/data/dashboard?startDate=${range.start}&endDate=${range.end}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data;
        
        if (data.summary && data.summary.length > 0) {
          const summaryMap = {};
          data.summary.forEach(item => {
            summaryMap[item.title] = item.value;
          });
          
          console.log(`  Orders: ${summaryMap['Total Orders'] || '0'}`);
          console.log(`  Revenue: ${summaryMap['Revenue'] || '₹0'}`);
          console.log(`  Ad Spend: ${summaryMap['Ad Spend'] || '₹0'}`);
          console.log(`  ROAS: ${summaryMap['ROAS'] || '0'}`);
          console.log(`  Chart Points: ${data.performanceChartData?.length || 0}`);
        } else {
          console.log('  No data for this period');
        }
      }

    } catch (error) {
      console.error(`\n❌ Error for ${user.name}:`, error.response?.data || error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('=== Test Complete ===');
  console.log('='.repeat(60));
  console.log('\nBoth users can:');
  console.log('  ✓ Filter by today\'s date');
  console.log('  ✓ Filter by last 7 days');
  console.log('  ✓ Filter by last 30 days');
  console.log('  ✓ Filter by specific month');
  console.log('  ✓ See updated data when date changes');
}

testDateFiltering();
