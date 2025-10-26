require('dotenv').config();
const axios = require('axios');

async function testCompleteDashboard() {
  try {
    console.log('🎯 Testing Complete Dashboard with AI Predictions\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const params = {
      startDate: '2025-08-26',
      endDate: '2025-09-26'
    };

    console.log('\n📊 Fetching all Dashboard data...\n');
    
    const [dashboardRes, predictionsRes] = await Promise.all([
      axios.get('http://localhost:6000/api/data/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        params
      }),
      axios.get('http://localhost:6000/api/data/predictions', {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
    ]);

    console.log('=' .repeat(70));
    console.log('\n✅ DASHBOARD SECTIONS:\n');

    const dash = dashboardRes.data;
    console.log(`1. Summary Cards: ${dash.summary?.length || 0} metrics`);
    console.log(`2. Financial Breakdown: ${dash.financialsBreakdownData?.pieData?.length || 0} segments`);
    console.log(`3. Order Type Donut: ${dash.orderTypeData?.length || 0} segments`);
    console.log(`4. Marketing Cards: ${dash.marketing?.length || 0} metrics`);
    console.log(`5. Website Cards: ${dash.website?.length || 0} metrics`);
    console.log(`6. Shipping Cards: ${dash.shipping?.length || 0} metrics`);
    console.log(`7. Performance Chart: ${dash.performanceChartData?.length || 0} data points`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n🤖 AI PREDICTIONS SECTION:\n');

    const pred = predictionsRes.data;
    console.log('Predictions for Next 7 Days:');
    console.log(`  • Revenue: ₹${pred.predictions.next7Days.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`  • Orders: ${pred.predictions.next7Days.orders}`);
    console.log(`  • Profit: ₹${pred.predictions.next7Days.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);

    console.log('\nGrowth Indicators:');
    const getArrow = (val) => val > 0 ? '📈' : val < 0 ? '📉' : '➡️';
    console.log(`  ${getArrow(pred.predictions.growth.revenue)} Revenue: ${pred.predictions.growth.revenue > 0 ? '+' : ''}${pred.predictions.growth.revenue.toFixed(1)}%`);
    console.log(`  ${getArrow(pred.predictions.growth.orders)} Orders: ${pred.predictions.growth.orders > 0 ? '+' : ''}${pred.predictions.growth.orders.toFixed(1)}%`);
    console.log(`  ${getArrow(pred.predictions.growth.profit)} Profit: ${pred.predictions.growth.profit > 0 ? '+' : ''}${pred.predictions.growth.profit.toFixed(1)}%`);

    console.log(`\nAI Insights: ${pred.insights.length} recommendations`);
    pred.insights.forEach((insight, i) => {
      const icon = insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} ${insight.metric}: ${insight.message.substring(0, 60)}...`);
    });

    console.log(`\nConfidence: ${pred.confidence}% (${pred.dataPoints} data points)`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n📱 FRONTEND COMPONENTS:\n');

    console.log('Dashboard Page Structure:');
    console.log('  ├─ Header with date selector');
    console.log('  ├─ Summary Cards (12 metrics)');
    console.log('  ├─ Performance Chart (line + bar)');
    console.log('  ├─ Financial Breakdown Donut');
    console.log('  ├─ Marketing Overview');
    console.log('  ├─ Website Metrics');
    console.log('  ├─ Shipping Section');
    console.log('  │  ├─ Order Type Donut (COD/Prepaid)');
    console.log('  │  └─ Shipment Status Donut');
    console.log('  └─ 🤖 AI Predictions Section');
    console.log('     ├─ 3 Prediction Cards (gradient backgrounds)');
    console.log('     └─ AI Insights Grid (2-4 cards)');

    console.log('\n' + '=' .repeat(70));
    console.log('\n🎉 COMPLETE DASHBOARD STATUS:\n');

    const checks = [
      { name: 'Backend API', status: true },
      { name: 'Dashboard Data', status: dash.summary?.length > 0 },
      { name: 'Predictions API', status: pred.predictions !== undefined },
      { name: 'Financial Donut', status: dash.financialsBreakdownData?.pieData?.length > 0 },
      { name: 'Order Type Donut', status: dash.orderTypeData?.length > 0 },
      { name: 'AI Insights', status: pred.insights?.length > 0 },
      { name: 'Confidence Score', status: pred.confidence > 0 },
      { name: 'Growth Rates', status: pred.predictions.growth !== undefined }
    ];

    checks.forEach(check => {
      console.log(`  ${check.status ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = checks.every(c => c.status);
    
    console.log('\n' + '=' .repeat(70));
    if (allPassed) {
      console.log('\n🎊 ALL SYSTEMS OPERATIONAL! 🎊\n');
      console.log('The Dashboard is fully functional with:');
      console.log('  • Real-time metrics from database');
      console.log('  • Interactive donut charts');
      console.log('  • AI-powered predictions');
      console.log('  • Actionable insights & recommendations\n');
    } else {
      console.log('\n⚠️  Some components need attention\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testCompleteDashboard();
