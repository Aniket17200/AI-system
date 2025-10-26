require('dotenv').config();
const axios = require('axios');

async function testShipmentStatusChart() {
  try {
    console.log('🧪 Testing Shipment Status Chart Data\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    // Test Dashboard endpoint
    console.log('\n📊 DASHBOARD ENDPOINT:\n');
    const dashboardResponse = await axios.get('http://localhost:6000/api/data/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      }
    });

    const { shipping } = dashboardResponse.data;

    console.log('Shipping Cards Data:');
    console.log(JSON.stringify(shipping, null, 2));

    console.log('\n' + '=' .repeat(70));
    console.log('\n📋 ANALYSIS:\n');

    // Check what values are available
    const delivered = shipping.find(c => c.title === 'Delivered');
    const inTransit = shipping.find(c => c.title === 'In-Transit');
    const rto = shipping.find(c => c.title === 'RTO');
    const ndrPending = shipping.find(c => c.title === 'NDR Pending');
    const pickupPending = shipping.find(c => c.title === 'Pickup Pending');

    console.log('Values found in shipping cards:');
    console.log(`  Delivered: ${delivered?.value || 'NOT FOUND'}`);
    console.log(`  In-Transit: ${inTransit?.value || 'NOT FOUND'}`);
    console.log(`  RTO: ${rto?.value || 'NOT FOUND'}`);
    console.log(`  NDR Pending: ${ndrPending?.value || 'NOT FOUND'}`);
    console.log(`  Pickup Pending: ${pickupPending?.value || 'NOT FOUND'}`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n🎯 EXPECTED CHART DATA:\n');

    // Simulate what the frontend will calculate
    const findValue = (title) => {
      const card = shipping.find(c => c.title === title);
      if (!card) return 0;
      const numValue = parseInt(String(card.value).replace(/[^0-9]/g, ''), 10);
      return isNaN(numValue) ? 0 : numValue;
    };

    const chartData = [
      { name: 'Delivered', value: findValue('Delivered'), color: '#10B981' },
      { name: 'In-Transit', value: findValue('In-Transit'), color: '#6366F1' },
      { name: 'RTO', value: findValue('RTO'), color: '#F44336' },
      { name: 'NDR Pending', value: findValue('NDR Pending'), color: '#F59E0B' },
      { name: 'Pickup Pending', value: findValue('Pickup Pending'), color: '#9CA3AF' },
    ].filter(item => item.value > 0);

    console.log('Chart data that will be rendered:');
    console.log(JSON.stringify(chartData, null, 2));

    if (chartData.length > 0) {
      console.log('\n✅ Shipment Status chart will display with', chartData.length, 'segments');
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      chartData.forEach(item => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        console.log(`   - ${item.name}: ${item.value} (${percentage}%)`);
      });
    } else {
      console.log('\n❌ NO DATA - Chart will show "No Status Data" message');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testShipmentStatusChart();
