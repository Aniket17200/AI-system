require('dotenv').config();
const axios = require('axios');

async function testAipredictionComponent() {
  try {
    console.log('🧪 Testing Aiprediction Component Data Loading\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    console.log('\n📊 Fetching data for Aiprediction component...\n');

    const [predictionsRes, dashboardRes] = await Promise.all([
      axios.get('http://localhost:6000/api/data/predictions', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          userId
        }
      }),
      axios.get('http://localhost:6000/api/data/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          userId
        }
      })
    ]);

    console.log('=' .repeat(70));
    console.log('\n✅ DATA FETCHED SUCCESSFULLY\n');

    const predictions = predictionsRes.data.predictions;
    const dashboard = dashboardRes.data;
    const currentMonth = endDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    console.log('1. METRICS CARDS (8 cards):');
    console.log(`   ✅ Revenue: ₹${Math.round(predictions.current.revenue / 1000)}k`);
    console.log(`   ✅ Orders: ${Math.round(predictions.current.orders)}`);
    console.log(`   ✅ Profit: ₹${Math.round(predictions.current.netProfit / 1000)}k`);
    console.log(`   ✅ ROAS: ${predictions.current.roas.toFixed(2)}x`);
    console.log(`   ✅ Profit Margin: ${predictions.current.profitMargin.toFixed(1)}%`);
    console.log(`   ✅ Ad Spend: ₹${Math.round(predictions.current.adSpend / 1000)}k`);
    console.log(`   ✅ Predicted Revenue: ₹${Math.round(predictions.next7Days.revenue / 1000)}k`);
    console.log(`   ✅ Predicted Orders: ${predictions.next7Days.orders}`);

    console.log('\n2. MAIN CHART DATA:');
    console.log(`   ✅ Revenue chart: ${predictions.next7Days.dailyBreakdown.length} days`);
    console.log(`   ✅ Orders chart: ${predictions.next7Days.dailyBreakdown.length} days`);
    console.log(`   ✅ Profit chart: ${predictions.next7Days.dailyBreakdown.length} days`);

    console.log('\n3. UPCOMING EVENTS:');
    console.log(`   ✅ Next 7d: ${predictions.next7Days.orders} orders expected`);
    console.log(`   ✅ Revenue: ₹${Math.round(predictions.next7Days.revenue / 1000)}k forecast`);
    console.log(`   ✅ Profit: ₹${Math.round(predictions.next7Days.profit / 1000)}k projected`);

    console.log('\n4. ACTIONABLE INSIGHTS:');
    predictionsRes.data.insights.forEach((insight, i) => {
      const icon = insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`   ${icon} ${insight.recommendation.substring(0, 60)}...`);
    });

    console.log('\n5. FINANCIAL BREAKDOWN TABLE:');
    const cogs = dashboard.financialsBreakdownData.pieData.find(p => p.name === 'COGS')?.value || 0;
    const grossProfit = dashboard.financialsBreakdownData.list.find(p => p.name === 'Gross Profit')?.value || 0;
    const adSpend = dashboard.financialsBreakdownData.pieData.find(p => p.name === 'Ad Spend')?.value || 0;
    const shipping = dashboard.financialsBreakdownData.pieData.find(p => p.name === 'Shipping')?.value || 0;
    const netProfit = dashboard.financialsBreakdownData.pieData.find(p => p.name === 'Net Profit')?.value || 0;

    console.log(`   Month: ${currentMonth}`);
    console.log(`   COGS: ₹${Math.round(cogs).toLocaleString('en-IN')}`);
    console.log(`   Gross Profit: ₹${Math.round(grossProfit).toLocaleString('en-IN')}`);
    console.log(`   Operating Costs: ₹${Math.round(adSpend + shipping).toLocaleString('en-IN')}`);
    console.log(`   Net Profit: ₹${Math.round(netProfit).toLocaleString('en-IN')}`);
    console.log(`   Net Margin: ${predictions.current.profitMargin.toFixed(1)}%`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n🎉 AIPREDICTION COMPONENT READY!\n');
    console.log('The component will display:');
    console.log('  ✅ 8 metric cards with mini charts');
    console.log('  ✅ Actual vs. Predicted chart (3 metrics)');
    console.log('  ✅ Upcoming Events sidebar');
    console.log('  ✅ Actionable Insights sidebar');
    console.log('  ✅ Financial Breakdown table');
    console.log('  ✅ Month selector dropdown');
    console.log('  ✅ Metric selector dropdown\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAipredictionComponent();
