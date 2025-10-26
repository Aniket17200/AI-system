const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';
const USER_ID = '68c812b0afc4892c1f8128e3'; // Tanesh user

const questions = {
  'MARKETING DATA': [
    'What is my ROAS in last 30 days?',
    'What is my ROAS in last 60 days?',
    'What is my ROAS in last 90 days?',
    'What is my cost per purchase in last 30 days?',
    'What is my cost per sale in last 60 days?',
    'How much I spend on ads in last 30 days?',
    'How much I spend on ads in last 60 days?',
    'What is my CTR in last 30 days?',
    'What is my sales from Meta ads in last 30 days?',
    'What is my CPM in last 30 days?',
    'What is my CPC in last 30 days?',
    'What is my POAS in last 30 days?'
  ],
  'WEBSITE/SALES DATA': [
    'What is my total sales in last 30 days?',
    'What is my total sales in last 60 days?',
    'What is my orders in last 30 days?',
    'What is my orders in last 90 days?',
    'What is my returning customer rate in last 30 days?',
    'What is my average order value in last 30 days?',
    'What is my average order value in last 60 days?',
    'What is my best selling products in last 30 days?',
    'What is my least selling products in last 30 days?'
  ],
  'SHIPPING DATA': [
    'What is my delivery rate in last 30 days?',
    'What is my RTO rate in last 30 days?',
    'What is my shipments in last 30 days?',
    'What is my in-transit orders?',
    'What is my NDR pending orders in last 30 days?',
    'What is my shipping spend in last 30 days?',
    'What is my average shipping cost in last 30 days?',
    'How much COD amount I received in last 30 days?'
  ],
  'FINANCIAL DATA': [
    'What is my net profit and net margin in last 30 days?',
    'What is my net profit in last 60 days?',
    'What is my gross profit and gross margin in last 30 days?',
    'What is my gross profit in last 90 days?',
    'What is my POAS in last 30 days?'
  ],
  'COMPARISONS & TRENDS': [
    'Compare my revenue in last 30 days vs last 60 days',
    'Show me my revenue trend',
    'What is my growth rate?',
    'Give me a complete business overview for last 30 days'
  ]
};

async function testQuestion(question, category) {
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE}/ai/chat`, {
      userId: USER_ID,
      message: question
    });

    const responseTime = Date.now() - startTime;
    const data = response.data.data;

    console.log('   ✅ SUCCESS');
    console.log(`   ⏱️  Response Time: ${responseTime}ms`);
    console.log(`   💬 Answer: ${data.message}`);
    console.log(`   📊 Tokens Used: ${data.usage?.total_tokens || 'N/A'}`);
    
    return { success: true, responseTime, tokens: data.usage?.total_tokens };

  } catch (error) {
    console.log('   ❌ FAILED');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   AI CHATBOT - COMPREHENSIVE QUESTION TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Testing User: ${USER_ID}`);
  console.log(`API Base: ${API_BASE}`);
  console.log(`⚠️  NOTE: Running with 3-second delays to avoid rate limits\n`);

  // Check if server is running
  try {
    await axios.get('http://localhost:6000/');
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('Please start: npm run dev\n');
    return;
  }

  console.log('✅ Server is running\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    totalTime: 0,
    totalTokens: 0
  };

  for (const [category, questionList] of Object.entries(questions)) {
    console.log(`\n📂 ${category}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (let i = 0; i < questionList.length; i++) {
      const question = questionList[i];
      results.total++;

      console.log(`${i + 1}. Question: "${question}"`);
      
      const result = await testQuestion(question, category);
      
      if (result.success) {
        results.passed++;
        results.totalTime += result.responseTime;
        results.totalTokens += result.tokens || 0;
      } else {
        results.failed++;
      }

      console.log('');
      
      // Longer delay to avoid rate limiting (3 seconds between requests)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Final Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   Total Questions: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  console.log('');
  console.log(`   ⏱️  Average Response Time: ${(results.totalTime / results.passed).toFixed(0)}ms`);
  console.log(`   📊 Average Tokens: ${Math.round(results.totalTokens / results.passed)}`);
  console.log(`   💰 Estimated Cost: $${((results.totalTokens / 1000) * 0.02).toFixed(4)}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (results.passed === results.total) {
    console.log('🎉 ALL TESTS PASSED! AI Chatbot is production-ready!\n');
  } else {
    console.log(`⚠️  ${results.failed} test(s) failed. Check errors above.\n`);
  }
}

// Run tests
console.log('\nStarting AI Chatbot Tests...\n');
runAllTests().catch(error => {
  console.error('Fatal Error:', error.message);
});
