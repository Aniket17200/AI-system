require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';
const USER_ID = '671c812b0afc4892c1f8128e3';

async function testAIChatIntegration() {
  try {
    console.log('🤖 Testing AI Chat Integration\n');
    console.log('=' .repeat(70));

    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId || loginResponse.data.user?._id || USER_ID;
    const userEmail = loginResponse.data.user?.email || loginResponse.data.email || 'taneshpurohit09@gmail.com';
    console.log(`✅ Logged in as: ${userEmail}`);
    console.log(`   User ID: ${userId}`);

    // Step 2: Get suggested questions
    console.log('\n2️⃣ Getting suggested questions...');
    const suggestionsResponse = await axios.get(
      `${API_BASE}/chat/suggestions/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (suggestionsResponse.data.success) {
      console.log('✅ Suggested questions loaded:');
      suggestionsResponse.data.data.slice(0, 5).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q}`);
      });
    }

    // Step 3: Test AI chat with different questions
    const testQuestions = [
      "What is my revenue in last 30 days?",
      "What is my ROAS?",
      "How many orders did I get?",
      "What is my profit margin?",
      "What is my delivery rate?"
    ];

    console.log('\n3️⃣ Testing AI Chat Responses...\n');
    console.log('=' .repeat(70));

    let conversationHistory = [];

    for (const question of testQuestions) {
      console.log(`\n💬 User: "${question}"`);
      
      const startTime = Date.now();
      
      try {
        const chatResponse = await axios.post(
          `${API_BASE}/chat/chat`,
          {
            userId: userId,
            message: question,
            conversationHistory: conversationHistory
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

          // Update conversation history
          conversationHistory.push(
            { role: "user", content: question },
            { role: "assistant", content: aiData.message }
          );

          // Keep only last 6 messages
          if (conversationHistory.length > 6) {
            conversationHistory = conversationHistory.slice(-6);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ AI CHAT INTEGRATION TEST COMPLETE!\n');
    console.log('Frontend Integration Points:');
    console.log('  • API Endpoint: /api/chat/chat');
    console.log('  • Suggestions: /api/chat/suggestions/:userId');
    console.log('  • Payload: { userId, message, conversationHistory }');
    console.log('  • Response: { success, data: { message, context, responseTime } }');
    console.log('  • Fallback: Automatically uses mock service if OpenAI unavailable\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAIChatIntegration();
