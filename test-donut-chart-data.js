require('dotenv').config();
const axios = require('axios');

async function testDonutChartData() {
  try {
    console.log('🧪 Testing Donut Chart Data\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    // Test Dashboard endpoint
    console.log('📊 DASHBOARD ENDPOINT:\n');
    const dashboardResponse = await axios.get('http://localhost:6000/api/data/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      }
    });

    const { financialsBreakdownData } = dashboardResponse.data;

    console.log('Financial Breakdown Data:');
    console.log(JSON.stringify(financialsBreakdownData, null, 2));

    // Test Shipping endpoint
    console.log('\n' + '=' .repeat(70));
    console.log('🚚 SHIPPING ENDPOINT:\n');
    
    const shippingResponse = await axios.get('http://localhost:6000/api/data/shipping', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      }
    });

    const { shipmentStatusData, codPaymentStatus, prepaidCodData } = shippingResponse.data;

    console.log('Shipment Status Data:');
    console.log(JSON.stringify(shipmentStatusData, null, 2));

    console.log('\nCOD Payment Status:');
    console.log(JSON.stringify(codPaymentStatus, null, 2));

    console.log('\nPrepaid/COD Data:');
    console.log(JSON.stringify(prepaidCodData, null, 2));

    // Check if data is suitable for donut charts
    console.log('\n' + '=' .repeat(70));
    console.log('📋 ANALYSIS:\n');

    if (shipmentStatusData && shipmentStatusData.length > 0) {
      const total = shipmentStatusData.reduce((sum, item) => sum + item.value, 0);
      console.log('✅ Shipment Status Data:');
      console.log(`   Total: ${total}`);
      shipmentStatusData.forEach(item => {
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
        console.log(`   ${item.name}: ${item.value} (${percentage}%)`);
      });
    } else {
      console.log('❌ Shipment Status Data: Empty or missing');
    }

    if (prepaidCodData && prepaidCodData.length > 0) {
      console.log('\n✅ Order Type Data (Prepaid/COD):');
      prepaidCodData.forEach(item => {
        console.log(`   ${item.name}: ${item.value}`);
      });
    } else {
      console.log('\n❌ Order Type Data: Empty or missing');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDonutChartData();
