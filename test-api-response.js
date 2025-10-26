require('dotenv').config();
const axios = require('axios');

async function testAPIResponse() {
  try {
    console.log('🔍 Testing API Response for Frontend\n');
    console.log('=' .repeat(70));

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // Test the exact endpoint that frontend uses
    console.log('📡 Fetching from /api/data/predictions-3month\n');
    
    const response = await axios.get('http://localhost:6000/api/data/predictions-3month', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('API Response Structure:');
    console.log('=' .repeat(70));
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n\nNovember 2025 Data:');
    console.log('=' .repeat(70));
    if (response.data.predictions && response.data.predictions.monthly) {
      const november = response.data.predictions.monthly[0];
      console.log(`Month: ${november.month} ${november.year}`);
      console.log(`Revenue: ${november.revenue}`);
      console.log(`Orders: ${november.orders}`);
      console.log(`Profit: ${november.profit}`);
      console.log(`ROAS: ${november.roas}`);
      console.log(`Profit Margin: ${november.profitMargin}`);
      
      if (november.revenue < 0 || november.orders < 0 || november.profit < 0) {
        console.log('\n❌ NEGATIVE VALUES IN API RESPONSE!');
      } else {
        console.log('\n✅ All values are positive in API response');
      }
    }

    console.log('\n' + '=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPIResponse();
