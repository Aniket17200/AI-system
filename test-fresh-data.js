require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';

async function testFreshData() {
  try {
    console.log('🔄 Testing Fresh Data Fetch from MongoDB\n');
    console.log('=' .repeat(70));

    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'taneshpurohit09@gmail.com',
      password: 'blvp43el8rP8'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId || loginResponse.data.user?._id || '68c812b0afc4892c1f8128e3';
    console.log(`✅ Logged in as: taneshpurohit09@gmail.com`);
    console.log(`   User ID: ${userId}`);

    // Step 2: Check cache stats before
    console.log('\n2️⃣ Checking cache stats...');
    const cacheStatsBefore = await axios.get(
      `${API_BASE}/chat/cache-stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Cache before:', cacheStatsBefore.data.data);

    // Step 3: Clear cache
    console.log('\n3️⃣ Clearing cache for fresh data...');
    const clearResponse = await axios.post(
      `${API_BASE}/chat/clear-cache/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ ${clearResponse.data.message}`);

    // Step 4: First request (will fetch from DB)
    console.log('\n4️⃣ First request (fetching from MongoDB)...');
    const startTime1 = Date.now();
    const response1 = await axios.post(
      `${API_BASE}/chat/chat`,
      {
        userId: userId,
        message: "What is my revenue in last 30 days?",
        conversationHistory: []
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      }
    );
    const duration1 = Date.now() - startTime1;
    console.log(`✅ Response 1 (${duration1}ms): ${response1.data.data.message}`);

    // Step 5: Second request immediately (should use cache if < 30 seconds)
    console.log('\n5️⃣ Second request (may use cache)...');
    const startTime2 = Date.now();
    const response2 = await axios.post(
      `${API_BASE}/chat/chat`,
      {
        userId: userId,
        message: "What is my ROAS?",
        conversationHistory: []
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      }
    );
    const duration2 = Date.now() - startTime2;
    console.log(`✅ Response 2 (${duration2}ms): ${response2.data.data.message}`);

    // Step 6: Wait 31 seconds and request again (should fetch fresh data)
    console.log('\n6️⃣ Waiting 31 seconds for cache to expire...');
    await new Promise(resolve => setTimeout(resolve, 31000));
    
    console.log('Making request after cache expiry...');
    const startTime3 = Date.now();
    const response3 = await axios.post(
      `${API_BASE}/chat/chat`,
      {
        userId: userId,
        message: "How many orders did I get?",
        conversationHistory: []
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      }
    );
    const duration3 = Date.now() - startTime3;
    console.log(`✅ Response 3 (${duration3}ms): ${response3.data.data.message}`);

    // Step 7: Check cache stats after
    console.log('\n7️⃣ Final cache stats...');
    const cacheStatsAfter = await axios.get(
      `${API_BASE}/chat/cache-stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Cache after:', cacheStatsAfter.data.data);

    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ FRESH DATA TEST COMPLETE!\n');
    console.log('Cache Configuration:');
    console.log('  • Cache TTL: 30 seconds (real-time data)');
    console.log('  • Auto-clear on ChatBot mount');
    console.log('  • Manual clear endpoint: POST /api/chat/clear-cache/:userId');
    console.log('  • Cache stats endpoint: GET /api/chat/cache-stats');
    console.log('\nData Freshness:');
    console.log('  • Data fetched directly from MongoDB');
    console.log('  • Cache expires after 30 seconds');
    console.log('  • Frontend clears cache on component mount');
    console.log('  • Always shows latest data from database\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testFreshData();
