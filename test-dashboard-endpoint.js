const axios = require('axios');

async function testDashboardEndpoint() {
  try {
    const userId = '68c812b0afc4892c1f8128e3';
    const startDate = '2025-07-27';
    const endDate = '2025-10-25';
    
    console.log('Testing dashboard endpoint...');
    console.log(`URL: http://localhost:6000/api/data/dashboard`);
    console.log(`Params: startDate=${startDate}, endDate=${endDate}, userId=${userId}`);
    
    const response = await axios.get('http://localhost:6000/api/data/dashboard', {
      params: {
        startDate,
        endDate,
        userId
      }
    });
    
    console.log('\n=== RESPONSE STATUS ===');
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    console.log('\n=== SUMMARY DATA ===');
    if (response.data.summary && response.data.summary.length > 0) {
      response.data.summary.forEach(item => {
        console.log(`${item.title}: ${item.value}`);
      });
    } else {
      console.log('❌ No summary data returned');
    }
    
    console.log('\n=== FINANCIAL BREAKDOWN ===');
    if (response.data.financialsBreakdownData) {
      console.log(`Revenue: ₹${response.data.financialsBreakdownData.revenue}`);
      if (response.data.financialsBreakdownData.list) {
        response.data.financialsBreakdownData.list.forEach(item => {
          console.log(`  ${item.name}: ₹${item.value.toFixed(2)}`);
        });
      }
    }
    
    console.log('\n=== PERFORMANCE CHART ===');
    if (response.data.performanceChartData && response.data.performanceChartData.length > 0) {
      console.log(`Total data points: ${response.data.performanceChartData.length}`);
      console.log('Sample (first 3):');
      response.data.performanceChartData.slice(0, 3).forEach(point => {
        console.log(`  ${point.name}: Revenue=₹${point.revenue.toFixed(2)}, NetProfit=₹${point.netProfit.toFixed(2)}`);
      });
    } else {
      console.log('❌ No performance chart data');
    }
    
    console.log('\n✅ Dashboard API is working!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDashboardEndpoint();
