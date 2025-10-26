require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';

async function testSpecificDate() {
  try {
    console.log('📅 Testing Specific Date: October 2, 2025\n');
    console.log('=' .repeat(70));

    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId || '68c812b0afc4892c1f8128e3';

    // Test specific date query
    console.log('\n💬 User: "How many orders on 2 October 2025?"\n');
    
    const chatResponse = await axios.post(
      `${API_BASE}/chat/chat`,
      {
        userId: userId,
        message: "How many orders on 2 October 2025?",
        conversationHistory: []
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      }
    );

    if (chatResponse.data.success) {
      const aiData = chatResponse.data.data;
      console.log(`🤖 AI Response:`);
      console.log(`   ${aiData.message}\n`);
      
      if (aiData.context) {
        console.log(`📊 Context Data:`);
        console.log(`   Date Range: ${aiData.context.dateRange}`);
        console.log(`   Total Days: ${aiData.context.totalDays}`);
        console.log(`   Orders: ${aiData.context.summary.totalOrders}`);
        console.log(`   Revenue: ₹${aiData.context.summary.totalRevenue.toLocaleString('en-IN')}`);
      }
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ Specific date query test complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSpecificDate();
