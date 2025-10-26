const axios = require('axios');

async function testFrontendMarketingFormat() {
  try {
    const userId = '68c812b0afc4892c1f8128e3';
    const startDate = '2025-07-27';
    const endDate = '2025-10-25';
    
    console.log('Testing Marketing API response format for frontend...\n');
    
    const response = await axios.get('http://localhost:6000/api/data/marketingData', {
      params: { startDate, endDate, userId }
    });
    
    const data = response.data;
    
    console.log('=== RESPONSE STRUCTURE CHECK ===\n');
    
    // Check summary
    console.log('1. Summary (adsSummaryData):');
    console.log(`   Type: ${Array.isArray(data.summary) ? 'Array ✓' : 'NOT Array ✗'}`);
    console.log(`   Length: ${data.summary?.length || 0}`);
    console.log(`   Format: ${Array.isArray(data.summary?.[0]) ? '[[key, value], ...] ✓' : 'Wrong format ✗'}`);
    if (data.summary && data.summary.length > 0) {
      console.log(`   Sample: ${JSON.stringify(data.summary[0])}`);
    }
    
    // Check campaignMetrics
    console.log('\n2. Campaign Metrics (metaCampaignMetrics):');
    console.log(`   Type: ${typeof data.campaignMetrics === 'object' ? 'Object ✓' : 'NOT Object ✗'}`);
    console.log(`   Campaigns: ${Object.keys(data.campaignMetrics || {}).length}`);
    if (data.campaignMetrics) {
      const firstCampaign = Object.keys(data.campaignMetrics)[0];
      console.log(`   First Campaign: ${firstCampaign}`);
      console.log(`   Has amountSpent: ${data.campaignMetrics[firstCampaign]?.amountSpent !== undefined ? '✓' : '✗'}`);
      console.log(`   Has impressions: ${data.campaignMetrics[firstCampaign]?.impressions !== undefined ? '✓' : '✗'}`);
      console.log(`   Has reach: ${data.campaignMetrics[firstCampaign]?.reach !== undefined ? '✓' : '✗'}`);
      console.log(`   Has linkClicks: ${data.campaignMetrics[firstCampaign]?.linkClicks !== undefined ? '✓' : '✗'}`);
      console.log(`   Has costPerClick: ${data.campaignMetrics[firstCampaign]?.costPerClick !== undefined ? '✓' : '✗'}`);
      console.log(`   Has sales: ${data.campaignMetrics[firstCampaign]?.sales !== undefined ? '✓' : '✗'}`);
      console.log(`   Has costPerSale: ${data.campaignMetrics[firstCampaign]?.costPerSale !== undefined ? '✓' : '✗'}`);
      console.log(`   Has roas: ${data.campaignMetrics[firstCampaign]?.roas !== undefined ? '✓' : '✗'}`);
    }
    
    // Check spendChartData
    console.log('\n3. Spend Chart Data (spendData):');
    console.log(`   Type: ${Array.isArray(data.spendChartData) ? 'Array ✓' : 'NOT Array ✗'}`);
    console.log(`   Length: ${data.spendChartData?.length || 0}`);
    if (data.spendChartData && data.spendChartData.length > 0) {
      const sample = data.spendChartData[0];
      console.log(`   Has name: ${sample.name !== undefined ? '✓' : '✗'}`);
      console.log(`   Has spend: ${sample.spend !== undefined ? '✓' : '✗'}`);
      console.log(`   Has cpp: ${sample.cpp !== undefined ? '✓' : '✗'}`);
      console.log(`   Has roas: ${sample.roas !== undefined ? '✓' : '✗'}`);
      console.log(`   Sample: ${JSON.stringify(sample)}`);
    }
    
    // Check adsChartData
    console.log('\n4. Ads Chart Data (metaAdsData):');
    console.log(`   Type: ${Array.isArray(data.adsChartData) ? 'Array ✓' : 'NOT Array ✗'}`);
    console.log(`   Length: ${data.adsChartData?.length || 0}`);
    if (data.adsChartData && data.adsChartData.length > 0) {
      const sample = data.adsChartData[0];
      console.log(`   Has name: ${sample.name !== undefined ? '✓' : '✗'}`);
      console.log(`   Has value: ${sample.value !== undefined ? '✓' : '✗'}`);
      console.log(`   Sample: ${JSON.stringify(sample)}`);
    }
    
    // Check analysisTable
    console.log('\n5. Analysis Table (detailedAnalysisData):');
    console.log(`   Type: ${Array.isArray(data.analysisTable) ? 'Array ✓' : 'NOT Array ✗'}`);
    console.log(`   Length: ${data.analysisTable?.length || 0}`);
    
    console.log('\n=== FRONTEND COMPATIBILITY CHECK ===\n');
    
    const issues = [];
    
    if (!Array.isArray(data.summary)) issues.push('❌ summary is not an array');
    if (!Array.isArray(data.summary?.[0])) issues.push('❌ summary items are not [key, value] pairs');
    if (typeof data.campaignMetrics !== 'object') issues.push('❌ campaignMetrics is not an object');
    if (!Array.isArray(data.spendChartData)) issues.push('❌ spendChartData is not an array');
    if (!Array.isArray(data.adsChartData)) issues.push('❌ adsChartData is not an array');
    if (!Array.isArray(data.analysisTable)) issues.push('❌ analysisTable is not an array');
    
    if (issues.length > 0) {
      console.log('ISSUES FOUND:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ ALL DATA STRUCTURES MATCH FRONTEND EXPECTATIONS!');
      console.log('✅ Frontend should be able to display data correctly');
    }
    
    console.log('\n=== WHAT FRONTEND WILL DISPLAY ===\n');
    console.log('Summary Cards:');
    data.summary?.forEach(([title, value]) => {
      console.log(`  ${title}: ${value}`);
    });
    
    console.log('\nCampaign Breakdown:');
    Object.entries(data.campaignMetrics || {}).forEach(([name, metrics]) => {
      console.log(`  ${name}:`);
      console.log(`    Amount Spent: ${metrics.amountSpent?.toLocaleString()}`);
      console.log(`    ROAS: ${metrics.roas}`);
      console.log(`    Impressions: ${metrics.impressions?.toLocaleString()}`);
    });
    
    console.log(`\nChart Data Points: ${data.spendChartData?.length || 0}`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendMarketingFormat();
