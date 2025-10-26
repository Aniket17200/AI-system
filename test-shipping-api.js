require('dotenv').config();
const axios = require('axios');

async function testShippingAPI() {
  try {
    console.log('🧪 Testing Shipping Data via API\n');

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test shipping endpoint
    console.log('📦 Testing /api/data/shipping endpoint\n');
    
    const response = await axios.get('http://localhost:6000/api/data/shipping', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      }
    });

    const { summaryData, shipmentStatusData } = response.data;

    console.log('📊 Summary Data:');
    summaryData.forEach(item => {
      // summaryData is an array of arrays: [['label', 'value'], ...]
      console.log(`  ${item[0]}: ${item[1]}`);
    });

    console.log('\n📈 Shipment Status:');
    shipmentStatusData.forEach(status => {
      console.log(`  ${status.name}: ${status.value}`);
    });

    console.log('\n✅ Shipping data is available via API!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testShippingAPI();
