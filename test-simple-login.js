require('dotenv').config();
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login to http://localhost:6000/api/auth/login\n');
    
    const response = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'duttanurag321@gmail.com',
      password: '@Tmflove321'
    }, {
      timeout: 5000
    });

    console.log('✓ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Is the server running on port 5000?');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLogin();
