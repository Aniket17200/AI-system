require('dotenv').config();
const axios = require('axios');

async function testFullRangeShipping() {
  try {
    console.log('🧪 Testing Full Date Range Shipping Cost\n');

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    // Test full range
    console.log('📅 Testing: July 27 - Oct 25, 2025\n');
    
    const response = await axios.get('http://localhost:6000/api/data/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-07-27',
        endDate: '2025-10-25'
      }
    });

    const { summary } = response.data;

    console.log('Dashboard Summary:');
    summary.forEach(item => {
      if (item.title.includes('Shipping') || item.title.includes('Cost') || item.title.includes('Profit')) {
        console.log(`  ${item.title}: ${item.value}`);
      }
    });

    const shippingCost = summary.find(s => s.title === 'Shipping Cost');
    
    console.log('\n📊 Result:');
    if (shippingCost) {
      console.log(`Shipping Cost: ${shippingCost.value}`);
      if (shippingCost.value === '₹0') {
        console.log('❌ PROBLEM: Showing ₹0');
      } else {
        console.log('✅ Showing correctly!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullRangeShipping();
