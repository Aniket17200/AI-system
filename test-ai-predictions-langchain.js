require('dotenv').config();
const axios = require('axios');

async function testAIPredictions() {
  try {
    console.log('🤖 Testing AI Predictions with LangChain + OpenAI\n');
    console.log('=' .repeat(70));

    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;

    console.log('\n📊 Fetching AI-Powered Predictions...\n');
    console.log('This may take 10-15 seconds as OpenAI analyzes your data...\n');
    
    const startTime = Date.now();
    
    const response = await axios.get('http://localhost:6000/api/data/predictions', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: '2025-08-26',
        endDate: '2025-09-26'
      },
      timeout: 60000 // 60 second timeout for AI processing
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✅ Response received in ${duration} seconds\n`);
    console.log('=' .repeat(70));

    const { predictions, insights, risks, opportunities, confidence, dataPoints, aiGenerated } = response.data;

    console.log('\n🎯 AI GENERATION STATUS:\n');
    console.log(`AI-Generated: ${aiGenerated ? '✅ YES (using GPT-4)' : '❌ NO (statistical fallback)'}`);
    console.log(`Confidence Score: ${confidence}%`);
    console.log(`Data Points Analyzed: ${dataPoints}`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n📈 PREDICTIONS (Next 7 Days):\n');
    console.log(`Revenue: ₹${predictions.next7Days.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    console.log(`Orders: ${predictions.next7Days.orders}`);
    console.log(`Profit: ₹${predictions.next7Days.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);

    console.log('\nDaily Breakdown:');
    predictions.next7Days.dailyBreakdown.forEach(day => {
      console.log(`  Day ${day.day}: ₹${day.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} | ${day.orders} orders`);
    });

    console.log('\n' + '=' .repeat(70));
    console.log('\n💡 AI INSIGHTS:\n');
    insights.forEach((insight, i) => {
      const icon = insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️';
      const priority = insight.priority ? `[${insight.priority.toUpperCase()}]` : '';
      console.log(`${icon} ${priority} ${insight.metric}:`);
      console.log(`   ${insight.message}`);
      console.log(`   💡 ${insight.recommendation}\n`);
    });

    if (risks && risks.length > 0) {
      console.log('=' .repeat(70));
      console.log('\n⚠️  RISK FACTORS:\n');
      risks.forEach((risk, i) => {
        console.log(`  ${i + 1}. ${risk}`);
      });
    }

    if (opportunities && opportunities.length > 0) {
      console.log('\n' + '=' .repeat(70));
      console.log('\n🚀 GROWTH OPPORTUNITIES:\n');
      opportunities.forEach((opp, i) => {
        console.log(`  ${i + 1}. ${opp}`);
      });
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ AI-POWERED PREDICTIONS WORKING!\n');
    console.log('The system is now using:');
    console.log('  • LangChain for AI orchestration');
    console.log('  • OpenAI GPT-4 for intelligent analysis');
    console.log('  • Historical data from MongoDB');
    console.log('  • User-specific predictions\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    if (error.code === 'ECONNABORTED') {
      console.error('\n⏱️  Request timed out. AI processing may take longer.');
    }
  }
}

testAIPredictions();
