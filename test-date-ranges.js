require('dotenv').config();
const axios = require('axios');

async function testDateRanges() {
  try {
    console.log('🧪 Testing Different Date Ranges\n');

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test different date ranges
    const dateRanges = [
      { name: 'Single Day (July 27)', start: '2025-07-27', end: '2025-07-27' },
      { name: 'One Week', start: '2025-07-27', end: '2025-08-03' },
      { name: 'One Month', start: '2025-07-27', end: '2025-08-27' },
      { name: 'Full Range', start: '2025-07-27', end: '2025-10-25' },
      { name: 'Last 30 Days', start: '2025-09-25', end: '2025-10-25' },
    ];

    for (const range of dateRanges) {
      console.log(`\n📅 Testing: ${range.name}`);
      console.log(`   Date Range: ${range.start} to ${range.end}`);

      const response = await axios.get('http://localhost:6000/api/data/marketingData', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: range.start,
          endDate: range.end
        }
      });

      const { summary, campaigns } = response.data;
      
      const amountSpent = summary.find(s => s[0] === 'Amount Spent')?.[1] || 'N/A';
      const impressions = summary.find(s => s[0] === 'Impressions')?.[1] || 'N/A';
      
      console.log(`   ✅ Amount Spent: ${amountSpent}`);
      console.log(`   ✅ Impressions: ${impressions}`);
      console.log(`   ✅ Campaigns: ${campaigns?.length || 0}`);
    }

    console.log('\n✅ All date ranges tested successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDateRanges();
