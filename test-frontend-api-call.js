require('dotenv').config();
const axios = require('axios');

async function testFrontendAPICall() {
  try {
    console.log('🔍 Testing Frontend API Call Pattern\n');
    console.log('=' .repeat(70));

    // Login
    const loginResponse = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Simulate frontend call
    const predictions3MonthRes = await axios.get('http://localhost:6000/api/data/predictions-3month').catch(() => null);

    console.log('predictions3MonthRes exists:', !!predictions3MonthRes);
    console.log('predictions3MonthRes.data exists:', !!predictions3MonthRes?.data);
    console.log('predictions3MonthRes.data.predictions exists:', !!predictions3MonthRes?.data?.predictions);
    console.log('predictions3MonthRes.data.success:', predictions3MonthRes?.data?.success);

    console.log('\nCondition check:');
    if (predictions3MonthRes && predictions3MonthRes.data.predictions) {
      console.log('✅ Would use 3-month predictions');
      console.log('\nFirst month data:');
      const firstMonth = predictions3MonthRes.data.predictions.monthly[0];
      console.log(JSON.stringify(firstMonth, null, 2));
    } else {
      console.log('❌ Would use fallback 7-day predictions');
      console.log('This is why frontend shows negative values!');
    }

    console.log('\n' + '=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testFrontendAPICall();
