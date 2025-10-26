require('dotenv').config();
const axios = require('axios');

function format(date, formatStr) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function checkNovemberPredictions() {
  try {
    console.log('🔍 Checking November 2025 Predictions\n');
    console.log('=' .repeat(70));

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId || '68c812b0afc4892c1f8128e3';
    console.log('✅ Logged in successfully\n');

    // Get predictions data (used by AIGrowth dashboard)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);

    console.log('📊 Fetching predictions data...');
    console.log(`Date Range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n`);

    const response = await axios.get('http://localhost:6000/api/data/predictions', {
      params: {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        userId
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data) {
      const { predictions, insights, confidence } = response.data;

      console.log('CURRENT METRICS:');
      console.log('=' .repeat(70));
      console.log(`Revenue: ₹${predictions.current.revenue.toLocaleString('en-IN')}`);
      console.log(`Orders: ${predictions.current.orders}`);
      console.log(`Profit: ₹${(predictions.current.profit || 0).toLocaleString('en-IN')}`);
      console.log(`ROAS: ${(predictions.current.roas || 0).toFixed(2)}x`);

      console.log('\n\nNEXT 7 DAYS PREDICTIONS:');
      console.log('=' .repeat(70));
      console.log(`Revenue: ₹${predictions.next7Days.revenue.toLocaleString('en-IN')}`);
      console.log(`Orders: ${predictions.next7Days.orders}`);
      console.log(`Profit: ₹${predictions.next7Days.profit.toLocaleString('en-IN')}`);

      if (predictions.next7Days.revenue < 0 || predictions.next7Days.orders < 0 || predictions.next7Days.profit < 0) {
        console.log('\n❌ ISSUE FOUND: Negative predictions detected!');
      }

      console.log('\n\nDAILY BREAKDOWN:');
      console.log('=' .repeat(70));
      predictions.next7Days.dailyBreakdown.forEach((day, i) => {
        console.log(`Day ${i + 1}: ₹${day.revenue.toLocaleString('en-IN')} | ${day.orders} orders | ₹${day.profit.toLocaleString('en-IN')} profit`);
        if (day.revenue < 0 || day.orders < 0 || day.profit < 0) {
          console.log(`  ❌ Negative value detected!`);
        }
      });

      console.log('\n\nGROWTH METRICS:');
      console.log('=' .repeat(70));
      console.log(`Revenue Growth: ${predictions.growth.revenue.toFixed(1)}%`);
      console.log(`Orders Growth: ${predictions.growth.orders.toFixed(1)}%`);
      console.log(`Profit Growth: ${predictions.growth.profit.toFixed(1)}%`);

      console.log('\n\nCONFIDENCE & INSIGHTS:');
      console.log('=' .repeat(70));
      console.log(`Confidence: ${confidence}%`);
      console.log(`AI Generated: ${response.data.aiGenerated ? 'Yes' : 'No (Statistical)'}`);
      console.log(`\nInsights: ${insights.length} items`);
      insights.forEach((insight, i) => {
        console.log(`  ${i + 1}. [${insight.type.toUpperCase()}] ${insight.metric}: ${insight.message.substring(0, 60)}...`);
      });
    }

    console.log('\n' + '=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkNovemberPredictions();
