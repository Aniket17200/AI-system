require('dotenv').config();
const axios = require('axios');

async function testFrontendPredictions() {
  try {
    console.log('🔍 Debugging Frontend Predictions Display\n');
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

    console.log('\n📊 Testing Predictions API Response...\n');
    
    const response = await axios.get('http://localhost:6000/api/data/predictions', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });

    console.log('Response Status:', response.status);
    console.log('Response Data Structure:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ FRONTEND CHECKS:\n');

    // Check what the frontend condition expects
    const hasData = response.data && response.data.predictions;
    console.log(`predictionsData exists: ${!!response.data}`);
    console.log(`predictionsData.predictions exists: ${!!response.data.predictions}`);
    console.log(`Condition (predictionsData && predictionsData.predictions): ${hasData}`);

    if (hasData) {
      console.log('\n✅ Data structure is correct for frontend display');
      console.log('\nPredictions that will display:');
      console.log(`  Revenue: ₹${response.data.predictions.next7Days.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
      console.log(`  Orders: ${response.data.predictions.next7Days.orders}`);
      console.log(`  Profit: ₹${response.data.predictions.next7Days.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
      console.log(`\nInsights: ${response.data.insights.length} cards`);
      console.log(`Confidence: ${response.data.confidence}%`);
    } else {
      console.log('\n❌ Data structure issue - frontend won\'t display');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n📱 FRONTEND RENDERING:\n');

    if (hasData) {
      console.log('The Dashboard should show:');
      console.log('  ✅ "🤖 AI-Powered Growth Predictions" header');
      console.log('  ✅ Confidence score badge');
      console.log('  ✅ 3 prediction cards (blue, green, purple gradients)');
      console.log('  ✅ Growth rate indicators');
      console.log(`  ✅ ${response.data.insights.length} AI insight cards`);
      console.log('\nIf not visible:');
      console.log('  1. Check browser console for errors');
      console.log('  2. Verify axiosInstance is configured correctly');
      console.log('  3. Check if predictions section is at bottom of page (scroll down)');
      console.log('  4. Hard refresh browser (Ctrl+Shift+R)');
    } else {
      console.log('❌ Predictions section will NOT render');
      console.log('   Reason: Missing predictions data in API response');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testFrontendPredictions();
