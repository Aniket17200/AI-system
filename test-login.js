const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api';

async function testLogin() {
  console.log('🧪 Testing Login Functionality\n');

  // Test 1: Login with existing user
  console.log('Test 1: Login with existing user (taneshpurohit09@gmail.com)');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'taneshpurohit09@gmail.com',
      password: 'test123' // You'll need to know the actual password
    });
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token.substring(0, 20) + '...');
    console.log('User ID:', response.data.userId);
    console.log();
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    console.log();
  }

  // Test 2: Login with wrong password
  console.log('Test 2: Login with wrong password');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'taneshpurohit09@gmail.com',
      password: 'wrongpassword'
    });
    console.log('❌ Should have failed but succeeded');
  } catch (error) {
    console.log('✅ Correctly rejected:', error.response?.data?.message);
    console.log();
  }

  // Test 3: Signup new user
  console.log('Test 3: Signup new user');
  try {
    const response = await axios.post(`${BASE_URL}/auth/signup`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'test123'
    });
    console.log('✅ Signup successful!');
    console.log('User ID:', response.data.userId);
    console.log();
  } catch (error) {
    console.log('ℹ️ Signup result:', error.response?.data?.message || error.message);
    console.log();
  }

  // Test 4: Get user info
  console.log('Test 4: Get user info');
  try {
    const response = await axios.get(`${BASE_URL}/auth/users/68c812b0afc4892c1f8128e3`);
    console.log('✅ User info retrieved!');
    console.log('Name:', response.data.data.firstName, response.data.data.lastName);
    console.log('Email:', response.data.data.email);
    console.log('Is Admin:', response.data.isAdmin);
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
    console.log();
  }
}

// Run tests
testLogin().catch(console.error);
