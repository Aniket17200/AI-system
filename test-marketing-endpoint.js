const axios = require('axios');

async function testMarketingEndpoint() {
  try {
    const userId = '68c812b0afc4892c1f8128e3';
    const startDate = '2025-07-27';
    const endDate = '2025-10-25';
    
    console.log('Testing Marketing Dashboard endpoint...\n');
    console.log(`URL: http://localhost:6000/api/data/marketingData`);
    console.log(`Params: startDate=${startDate}, endDate=${endDate}, userId=${userId}\n`);
    
    const response = await axios.get('http://localhost:6000/api/data/marketingData', {
      params: { startDate, endDate, userId }
    });
    
    console.log('=== RESPONSE STATUS ===');
    console.log(`Status: ${response.status} ${response.statusText}\n`);
    
    console.log('=== RESPONSE DATA STRUCTURE ===');
    console.log(`Keys: ${Object.keys(response.data).join(', ')}\n`);
    
    console.log('=== SUMMARY ===');
    if (response.data.summary) {
      console.log(`Type: ${Array.isArray(response.data.summary) ? 'Array' : 'Object'}`);
      console.log(`Length: ${response.data.summary.length}`);
      console.log('\nSummary data:');
      response.data.summary.forEach(item => {
        if (Array.isArray(item)) {
          console.log(`  ${item[0]}: ${item[1]}`);
        } else {
          console.log(`  ${JSON.stringify(item)}`);
        }
      });
    } else {
      console.log('❌ No summary data');
    }
    
    console.log('\n=== CAMPAIGN METRICS ===');
    if (response.data.campaignMetrics) {
      console.log(`Campaigns: ${Object.keys(response.data.campaignMetrics).length}`);
      Object.entries(response.data.campaignMetrics).forEach(([name, metrics]) => {
        console.log(`\n${name}:`);
        console.log(`  Amount Spent: ₹${metrics.amountSpent}`);
        console.log(`  Impressions: ${metrics.impressions}`);
        console.log(`  Reach: ${metrics.reach}`);
        console.log(`  Link Clicks: ${metrics.linkClicks}`);
        console.log(`  Cost Per Click: ₹${metrics.costPerClick}`);
        console.log(`  Sales: ₹${metrics.sales}`);
        console.log(`  ROAS: ${metrics.roas}`);
      });
    } else {
      console.log('❌ No campaign metrics');
    }
    
    console.log('\n=== SPEND CHART DATA ===');
    if (response.data.spendChartData) {
      console.log(`Data points: ${response.data.spendChartData.length}`);
      if (response.data.spendChartData.length > 0) {
        console.log('\nSample (first 3):');
        response.data.spendChartData.slice(0, 3).forEach(point => {
          console.log(`  ${point.name}: Spend=₹${point.spend}, CPP=₹${point.cpp}, ROAS=${point.roas}`);
        });
      }
    } else {
      console.log('❌ No spend chart data');
    }
    
    console.log('\n=== ADS CHART DATA ===');
    if (response.data.adsChartData) {
      console.log(`Data points: ${response.data.adsChartData.length}`);
      response.data.adsChartData.forEach(item => {
        console.log(`  ${item.name}: ₹${item.value}`);
      });
    } else {
      console.log('❌ No ads chart data');
    }
    
    console.log('\n=== FULL RESPONSE (JSON) ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n✅ Marketing endpoint is working!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Server is not running! Start it with: npm start');
    }
  }
}

testMarketingEndpoint();
