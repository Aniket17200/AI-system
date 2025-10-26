require('dotenv').config();
const axios = require('axios');

async function testDonutCharts() {
  try {
    console.log('🧪 Testing Donut Charts - Final Verification\n');
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

    const { orderTypeData, financialsBreakdownData } = dashboardResponse.data;

    console.log('✅ Order Type Data (for Dashboard):');
    if (orderTypeData && orderTypeData.length > 0) {
      console.log(JSON.stringify(orderTypeData, null, 2));
      console.log(`   Total segments: ${orderTypeData.length}`);
    } else {
      console.log('   ❌ NO DATA - This is the problem!');
    }

    console.log('\n✅ Financial Breakdown Data (for Dashboard):');
    if (financialsBreakdownData?.pieData && financialsBreakdownData.pieData.length > 0) {
      console.log(`   Total segments: ${financialsBreakdownData.pieData.length}`);
      financialsBreakdownData.pieData.forEach(item => {
        console.log(`   - ${item.name}: ₹${item.value.toLocaleString('en-IN')}`);
      });
    }

    // Test Shipping endpoint
    console.log('\n' + '=' .repeat(70));
    console.log('\n🚚 SHIPPING ENDPOINT:\n');
    
    const shippingResponse = await axios.get('http://localhost:6000/api/data/shipping', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      }
    });

    const { shipmentStatusData, prepaidCodData } = shippingResponse.data;

    console.log('✅ Shipment Status Data (for Shipping page):');
    if (shipmentStatusData && shipmentStatusData.length > 0) {
      console.log(JSON.stringify(shipmentStatusData, null, 2));
      console.log(`   Total segments: ${shipmentStatusData.length}`);
    } else {
      console.log('   ❌ NO DATA');
    }

    console.log('\n✅ Prepaid/COD Data (for Shipping page):');
    if (prepaidCodData && prepaidCodData.length > 0) {
      console.log(JSON.stringify(prepaidCodData, null, 2));
      console.log(`   Total segments: ${prepaidCodData.length}`);
    }

    // Final verdict
    console.log('\n' + '=' .repeat(70));
    console.log('\n📋 FINAL VERDICT:\n');

    const dashboardOrderTypeOk = orderTypeData && orderTypeData.length > 0;
    const dashboardFinancialsOk = financialsBreakdownData?.pieData && financialsBreakdownData.pieData.length > 0;
    const shippingStatusOk = shipmentStatusData && shipmentStatusData.length > 0;

    console.log(`Dashboard Order Type Chart: ${dashboardOrderTypeOk ? '✅ READY' : '❌ NOT READY'}`);
    console.log(`Dashboard Financial Breakdown Chart: ${dashboardFinancialsOk ? '✅ READY' : '❌ NOT READY'}`);
    console.log(`Shipping Shipment Status Chart: ${shippingStatusOk ? '✅ READY' : '❌ NOT READY'}`);

    if (dashboardOrderTypeOk && dashboardFinancialsOk && shippingStatusOk) {
      console.log('\n🎉 ALL DONUT CHARTS ARE READY TO DISPLAY ON FRONTEND!');
    } else {
      console.log('\n⚠️  Some charts are missing data. Check the issues above.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDonutCharts();
