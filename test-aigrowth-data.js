require('dotenv').config();
const axios = require('axios');

async function testAIGrowthData() {
  try {
    console.log('🧪 Testing AI Growth Dashboard Data Loading\n');
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

    console.log('\n📊 Fetching all required data for AI Growth Dashboard...\n');

    // Fetch both endpoints that AIGrowth.jsx needs
    const [predictionsRes, dashboardRes] = await Promise.all([
      axios.get('http://localhost:6000/api/data/predictions', {
        headers: { Authorization: `Bearer ${token}` },
        params
      }),
      axios.get('http://localhost:6000/api/data/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
    ]);

    console.log('=' .repeat(70));
    console.log('\n✅ DATA FETCHED SUCCESSFULLY\n');

    // Check predictions data
    const pred = predictionsRes.data;
    console.log('1. PREDICTIONS DATA:');
    console.log(`   ✅ predictions.next7Days: ${pred.predictions?.next7Days ? 'Present' : 'Missing'}`);
    console.log(`   ✅ predictions.current: ${pred.predictions?.current ? 'Present' : 'Missing'}`);
    console.log(`   ✅ predictions.growth: ${pred.predictions?.growth ? 'Present' : 'Missing'}`);
    console.log(`   ✅ insights: ${pred.insights?.length || 0} items`);
    console.log(`   ✅ confidence: ${pred.confidence}%`);
    console.log(`   ✅ aiGenerated: ${pred.aiGenerated}`);

    // Check dashboard data
    const dash = dashboardRes.data;
    console.log('\n2. DASHBOARD DATA:');
    console.log(`   ✅ financialsBreakdownData: ${dash.financialsBreakdownData ? 'Present' : 'Missing'}`);
    console.log(`   ✅ pieData: ${dash.financialsBreakdownData?.pieData?.length || 0} segments`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n📱 FRONTEND COMPONENT CHECKS:\n');

    // Check what AIGrowth.jsx needs
    const checks = [
      { 
        name: 'predictions.next7Days.revenue', 
        value: pred.predictions?.next7Days?.revenue,
        status: !!pred.predictions?.next7Days?.revenue
      },
      { 
        name: 'predictions.next7Days.orders', 
        value: pred.predictions?.next7Days?.orders,
        status: !!pred.predictions?.next7Days?.orders
      },
      { 
        name: 'predictions.next7Days.profit', 
        value: pred.predictions?.next7Days?.profit,
        status: !!pred.predictions?.next7Days?.profit
      },
      { 
        name: 'predictions.next7Days.dailyBreakdown', 
        value: `${pred.predictions?.next7Days?.dailyBreakdown?.length || 0} days`,
        status: !!pred.predictions?.next7Days?.dailyBreakdown
      },
      { 
        name: 'predictions.current', 
        value: 'Object',
        status: !!pred.predictions?.current
      },
      { 
        name: 'insights array', 
        value: `${pred.insights?.length || 0} items`,
        status: Array.isArray(pred.insights)
      },
      { 
        name: 'financialData (pieData)', 
        value: `${dash.financialsBreakdownData?.pieData?.length || 0} segments`,
        status: !!dash.financialsBreakdownData?.pieData
      },
      { 
        name: 'confidence score', 
        value: `${pred.confidence}%`,
        status: !!pred.confidence
      }
    ];

    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.value}`);
    });

    const allPassed = checks.every(c => c.status);

    console.log('\n' + '=' .repeat(70));
    console.log('\n📊 SAMPLE DATA FOR FRONTEND:\n');

    console.log('Actual vs Predicted Chart Data:');
    console.log(`  Daily breakdown: ${pred.predictions.next7Days.dailyBreakdown.length} days`);
    pred.predictions.next7Days.dailyBreakdown.slice(0, 3).forEach(day => {
      console.log(`    Day ${day.day}: ₹${day.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    });

    console.log('\nUpcoming Events:');
    console.log(`  Next 7 Days Orders: ${pred.predictions.next7Days.orders}`);
    console.log(`  Revenue Forecast: ₹${pred.predictions.next7Days.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`  Profit Projection: ₹${pred.predictions.next7Days.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);

    console.log('\nActionable Insights:');
    pred.insights.slice(0, 3).forEach((insight, i) => {
      const icon = insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} ${insight.metric}: ${insight.recommendation.substring(0, 50)}...`);
    });

    console.log('\nFinancial Breakdown:');
    dash.financialsBreakdownData.pieData.forEach(item => {
      console.log(`  ${item.name}: ₹${item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    });

    console.log('\n' + '=' .repeat(70));
    
    if (allPassed) {
      console.log('\n🎉 ALL DATA READY FOR AI GROWTH DASHBOARD!\n');
      console.log('The AIGrowth.jsx component should display:');
      console.log('  ✅ Actual vs. Predicted Revenue Chart');
      console.log('  ✅ Upcoming Events (3 cards)');
      console.log('  ✅ Actionable Insights (3 cards)');
      console.log('  ✅ Financial Breakdown Pie Chart');
      console.log('  ✅ Monthly Financial Table');
      console.log('  ✅ Detailed AI Insights Grid\n');
    } else {
      console.log('\n⚠️  Some data is missing. Check the issues above.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAIGrowthData();
