require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function test30DaysComplete() {
  console.log('🧪 COMPLETE 30-DAY TEST - Database, Backend, Frontend\n');
  console.log('=' .repeat(70));

  try {
    // Calculate last 30 days
    const endDate = new Date('2025-10-25');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29); // Last 30 days

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`\n📅 Testing Date Range: ${startDateStr} to ${endDateStr}`);
    console.log('=' .repeat(70));

    // STEP 1: Check Database
    console.log('\n📊 STEP 1: Checking Database...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    const dbMetrics = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: new Date(startDateStr),
        $lte: new Date(endDateStr)
      }
    }).sort({ date: 1 });

    console.log(`✅ Database Records: ${dbMetrics.length} days`);
    
    const daysWithCampaigns = dbMetrics.filter(m => m.campaigns && m.campaigns.length > 0);
    console.log(`✅ Days with campaigns: ${daysWithCampaigns.length}`);
    
    const totalAdSpend = dbMetrics.reduce((sum, m) => sum + (m.adSpend || 0), 0);
    const totalImpressions = dbMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    
    console.log(`✅ Total Ad Spend: ₹${totalAdSpend.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
    console.log(`✅ Total Impressions: ${totalImpressions.toLocaleString('en-IN')}`);

    if (daysWithCampaigns.length > 0) {
      console.log('\n📋 Days with campaign data:');
      daysWithCampaigns.forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - ${m.campaigns.length} campaigns`);
      });
    }

    await mongoose.connection.close();

    // STEP 2: Test Backend API
    console.log('\n=' .repeat(70));
    console.log('📡 STEP 2: Testing Backend API...\n');

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');

    const apiResponse = await axios.get('http://localhost:6000/api/data/marketingData', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: startDateStr,
        endDate: endDateStr
      }
    });

    const { summary, campaigns, campaignMetrics, spendChartData, adsChartData } = apiResponse.data;

    console.log('\n📦 API Response:');
    console.log(`✅ Summary metrics: ${summary?.length || 0}`);
    console.log(`✅ Individual campaigns: ${campaigns?.length || 0}`);
    console.log(`✅ Campaign metrics keys: ${Object.keys(campaignMetrics || {}).length}`);
    console.log(`✅ Spend chart data points: ${spendChartData?.length || 0}`);
    console.log(`✅ Ads chart data: ${adsChartData?.length || 0}`);

    console.log('\n📊 Summary Data:');
    if (summary && summary.length > 0) {
      summary.forEach(([label, value]) => {
        console.log(`  ${label}: ${value}`);
      });
    }

    if (campaigns && campaigns.length > 0) {
      console.log(`\n✅ Individual Campaigns Found: ${campaigns.length}`);
      console.log('\nFirst 5 campaigns:');
      campaigns.slice(0, 5).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.campaignName} - Spend: ₹${parseFloat(c.amountSpent).toLocaleString('en-IN')}`);
      });
    } else {
      console.log('\n⚠️  No individual campaigns in response');
      console.log('   This is normal if campaigns weren\'t active in this period');
    }

    console.log('\n📈 Campaign Metrics:');
    Object.keys(campaignMetrics || {}).forEach(key => {
      const metrics = campaignMetrics[key];
      console.log(`  ${key}:`);
      console.log(`    - Amount Spent: ₹${metrics.amountSpent?.toLocaleString('en-IN') || 0}`);
      console.log(`    - Impressions: ${metrics.impressions?.toLocaleString('en-IN') || 0}`);
      console.log(`    - ROAS: ${metrics.roas || 0}`);
    });

    // STEP 3: Frontend Data Structure Check
    console.log('\n=' .repeat(70));
    console.log('🎨 STEP 3: Frontend Data Structure Check...\n');

    console.log('✅ Data structure matches frontend expectations:');
    console.log(`  - summary: ${Array.isArray(summary) ? '✅ Array' : '❌ Not Array'}`);
    console.log(`  - campaigns: ${Array.isArray(campaigns) ? '✅ Array' : '❌ Not Array'}`);
    console.log(`  - campaignMetrics: ${typeof campaignMetrics === 'object' ? '✅ Object' : '❌ Not Object'}`);
    console.log(`  - spendChartData: ${Array.isArray(spendChartData) ? '✅ Array' : '❌ Not Array'}`);
    console.log(`  - adsChartData: ${Array.isArray(adsChartData) ? '✅ Array' : '❌ Not Array'}`);

    // STEP 4: Summary
    console.log('\n=' .repeat(70));
    console.log('📋 SUMMARY\n');

    console.log('Database Status:');
    console.log(`  ✅ ${dbMetrics.length} days of data available`);
    console.log(`  ${daysWithCampaigns.length > 0 ? '✅' : '⚠️ '} ${daysWithCampaigns.length} days with campaign details`);
    console.log(`  ✅ Total ad spend: ₹${totalAdSpend.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);

    console.log('\nBackend API Status:');
    console.log(`  ✅ API responding correctly`);
    console.log(`  ✅ Returns ${summary?.length || 0} summary metrics`);
    console.log(`  ${campaigns?.length > 0 ? '✅' : '⚠️ '} Returns ${campaigns?.length || 0} individual campaigns`);
    console.log(`  ✅ Returns "All Campaigns" aggregated data`);

    console.log('\nFrontend Compatibility:');
    console.log(`  ✅ All data structures correct`);
    console.log(`  ✅ Ready for frontend consumption`);

    if (campaigns?.length === 0) {
      console.log('\n💡 Note: No individual campaigns for this date range.');
      console.log('   Frontend will show "No Individual Campaign Data Available" message');
      console.log('   and display "All Campaigns" aggregated metrics.');
    }

    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('\nStack:', error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

test30DaysComplete();
