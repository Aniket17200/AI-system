require('dotenv').config();
const axios = require('axios');

async function checkAIGrowthROAS() {
  try {
    console.log('🔍 Checking AI Growth Dashboard ROAS Predictions\n');
    console.log('=' .repeat(70));

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // Get AI Growth data
    console.log('📊 Fetching AI Growth Dashboard data...\n');
    const response = await axios.get('http://localhost:6000/api/data/ai-growth', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const data = response.data.data;

      console.log('HISTORICAL DATA (Past 3 Months):');
      console.log('=' .repeat(70));
      data.historical.forEach(month => {
        console.log(`\n${month.month} ${month.year}:`);
        console.log(`  Revenue: ₹${month.revenue.toLocaleString('en-IN')}`);
        console.log(`  Ad Spend: ₹${month.adSpend.toLocaleString('en-IN')}`);
        console.log(`  ROAS: ${month.roas.toFixed(2)}x`);
        console.log(`  Profit: ₹${month.profit.toLocaleString('en-IN')}`);
        console.log(`  Profit Margin: ${month.profitMargin.toFixed(2)}%`);
      });

      console.log('\n\nPREDICTED DATA (Next 2 Months):');
      console.log('=' .repeat(70));
      data.predicted.forEach(month => {
        console.log(`\n${month.month} ${month.year}:`);
        console.log(`  Revenue: ₹${month.revenue.toLocaleString('en-IN')}`);
        console.log(`  Ad Spend: ₹${month.adSpend.toLocaleString('en-IN')}`);
        console.log(`  ROAS: ${month.roas.toFixed(2)}x ⚠️`);
        console.log(`  Profit: ₹${month.profit.toLocaleString('en-IN')}`);
        console.log(`  Profit Margin: ${month.profitMargin.toFixed(2)}%`);
      });

      // Calculate average historical ROAS
      const avgHistoricalROAS = data.historical.reduce((sum, m) => sum + m.roas, 0) / data.historical.length;
      const avgHistoricalMargin = data.historical.reduce((sum, m) => sum + m.profitMargin, 0) / data.historical.length;

      console.log('\n\nANALYSIS:');
      console.log('=' .repeat(70));
      console.log(`Average Historical ROAS: ${avgHistoricalROAS.toFixed(2)}x`);
      console.log(`Average Historical Profit Margin: ${avgHistoricalMargin.toFixed(2)}%`);
      console.log(`\nPredicted ROAS for November: ${data.predicted[0].roas.toFixed(2)}x`);
      console.log(`Predicted ROAS for December: ${data.predicted[1].roas.toFixed(2)}x`);
      
      console.log('\n❌ ISSUE: Predicted ROAS is too low!');
      console.log('Expected: Should be based on historical average (~10-12x)');
      console.log('Actual: Showing 1.27x\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkAIGrowthROAS();
