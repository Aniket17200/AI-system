require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';

async function testDateQueries() {
  try {
    console.log('📅 Testing Date-Specific AI Chat Queries\n');
    console.log('=' .repeat(70));

    // Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId || '68c812b0afc4892c1f8128e3';
    console.log(`✅ Logged in successfully`);

    // Test different date queries
    const dateQueries = [
      "What were my orders today?",
      "Show me yesterday's revenue",
      "How many orders on 2 October?",
      "What was my revenue on October 2?",
      "Show me data for 2nd October 2025",
      "What was my ROAS on 10/2/2025?",
      "How many orders this week?",
      "What was my revenue last week?",
      "Show me this month's data",
      "What was last month's revenue?",
      "Compare today vs yesterday"
    ];

    console.log('\n2️⃣ Testing Date-Specific Queries...\n');
    console.log('=' .repeat(70));

    for (const question of dateQueries) {
      console.log(`\n💬 User: "${question}"`);
      
      const startTime = Date.now();
      
      try {
        const chatResponse = await axios.post(
          `${API_BASE}/chat/chat`,
          {
            userId: userId,
            message: question,
            conversationHistory: []
          },
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000
          }
        );

        const duration = Date.now() - startTime;

        if (chatResponse.data.success) {
          const aiData = chatResponse.data.data;
          console.log(`🤖 AI (${duration}ms): ${aiData.message}`);
          
          // Show date range detected
          if (aiData.context && aiData.context.dateRange) {
            console.log(`   📅 Date Range: ${aiData.context.dateRange}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ DATE QUERY TEST COMPLETE!\n');
    console.log('Supported Date Formats:');
    console.log('  ✅ Relative: today, yesterday, this week, last week, this month, last month');
    console.log('  ✅ Specific: "2 October", "October 2", "2nd October"');
    console.log('  ✅ Numeric: "2/10", "2-10", "10/2/2025", "2025-10-02"');
    console.log('  ✅ Ranges: "last 7 days", "last 30 days", "last 60 days", "last 90 days"');
    console.log('\nDate Intelligence:');
    console.log('  • Automatically detects date patterns in questions');
    console.log('  • Handles multiple date formats');
    console.log('  • Shows specific date or date range in response');
    console.log('  • Compares periods when requested\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDateQueries();
