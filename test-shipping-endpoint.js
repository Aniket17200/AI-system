const axios = require('axios');

async function testShippingEndpoint() {
  try {
    const userId = '68c812b0afc4892c1f8128e3';
    const startDate = '2025-07-27';
    const endDate = '2025-10-25';
    
    console.log('Testing Shipping endpoint...\n');
    
    const response = await axios.get('http://localhost:6000/api/data/shipping', {
      params: { startDate, endDate, userId }
    });
    
    console.log('=== RESPONSE STATUS ===');
    console.log(`Status: ${response.status} OK\n`);
    
    console.log('=== DATA STRUCTURE ===');
    console.log(`Keys: ${Object.keys(response.data).join(', ')}\n`);
    
    console.log('=== SUMMARY DATA ===');
    if (response.data.summaryData) {
      console.log(`Length: ${response.data.summaryData.length}`);
      response.data.summaryData.forEach(([title, value]) => {
        console.log(`  ${title}: ${value}`);
      });
    }
    
    console.log('\n=== SHIPMENT STATUS DATA ===');
    if (response.data.shipmentStatusData) {
      console.log(`Items: ${response.data.shipmentStatusData.length}`);
      response.data.shipmentStatusData.forEach(item => {
        console.log(`  ${item.name}: ${item.value}`);
      });
    }
    
    console.log('\n=== COD PAYMENT STATUS ===');
    if (response.data.codPaymentStatus) {
      response.data.codPaymentStatus.forEach(([title, value]) => {
        console.log(`  ${title}: ${value}`);
      });
    }
    
    console.log('\n=== CHART DATA ===');
    if (response.data.chartData) {
      console.log(`Metrics: ${Object.keys(response.data.chartData).join(', ')}`);
      Object.entries(response.data.chartData).forEach(([metric, data]) => {
        console.log(`  ${metric}: ${data.length} data points`);
      });
    }
    
    console.log('\n=== TOTALS ===');
    if (response.data.totals) {
      console.log(`Total Shipments: ${response.data.totals.totalShipments}`);
      console.log(`Delivered: ${response.data.totals.delivered}`);
      console.log(`RTO: ${response.data.totals.rto}`);
      console.log(`Delivery Rate: ${response.data.totals.deliveryRate}%`);
    }
    
    console.log('\n✅ Shipping endpoint is working!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testShippingEndpoint();
