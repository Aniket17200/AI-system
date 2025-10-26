require('dotenv').config();
const axios = require('axios');

async function testPredictions() {
  try {
    console.log('🤖 Testing AI-Powered Growth Predictions\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    console.log('\n📊 Fetching Predictions...\n');
    
    const response = await axios.get('http://localhost:6000/api/data/predictions', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      }
    });

    const { predictions, insights, confidence, dataPoints } = response.data;

    console.log('=' .repeat(70));
    console.log('\n📈 CURRENT METRICS:\n');
    console.log(`Revenue: ₹${predictions.current.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`Orders: ${Math.round(predictions.current.orders)}`);
    console.log(`Net Profit: ₹${predictions.current.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`ROAS: ${predictions.current.roas.toFixed(2)}x`);
    console.log(`Profit Margin: ${predictions.current.profitMargin.toFixed(1)}%`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n📊 GROWTH RATES:\n');
    console.log(`Revenue Growth: ${predictions.growth.revenue > 0 ? '+' : ''}${predictions.growth.revenue.toFixed(1)}%`);
    console.log(`Orders Growth: ${predictions.growth.orders > 0 ? '+' : ''}${predictions.growth.orders.toFixed(1)}%`);
    console.log(`Profit Growth: ${predictions.growth.profit > 0 ? '+' : ''}${predictions.growth.profit.toFixed(1)}%`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n🔮 PREDICTIONS (Next 7 Days):\n');
    console.log(`Predicted Revenue: ₹${predictions.next7Days.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`Predicted Orders: ${predictions.next7Days.orders}`);
    console.log(`Predicted Profit: ₹${predictions.next7Days.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);

    console.log('\nDaily Breakdown:');
    predictions.next7Days.dailyBreakdown.forEach(day => {
      console.log(`  Day ${day.day}: ₹${day.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} | ${day.orders} orders | ₹${day.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} profit`);
    });

    console.log('\n' + '=' .repeat(70));
    console.log('\n💡 AI INSIGHTS:\n');
    insights.forEach((insight, i) => {
      const icon = insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${insight.metric}:`);
      console.log(`   ${insight.message}`);
      console.log(`   💡 ${insight.recommendation}\n`);
    });

    console.log('=' .repeat(70));
    console.log(`\n🎯 Confidence Score: ${confidence}% (based on ${dataPoints} data points)\n`);

    console.log('=' .repeat(70));
    console.log('\n✅ AI Predictions are working correctly!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testPredictions();
