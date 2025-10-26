const axios = require('axios');

async function testLogin() {
  console.log('Testing login with actual credentials...\n');
  
  try {
    const response = await axios.post('http://localhost:6000/api/auth/login', {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test getting user info
    const userId = response.data.userId;
    const token = response.data.token;
    
    console.log('\nTesting user info fetch...');
    const userResponse = await axios.get(`http://localhost:6000/api/auth/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User info retrieved!');
    console.log('User:', JSON.stringify(userResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error:', error.response?.data || error.message);
    console.log('\nFull error details:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testLogin();
