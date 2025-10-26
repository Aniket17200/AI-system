const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';
const USER_ID = '68c812b0afc4892c1f8128e3'; // Tanesh user

// Quick test with just 5 questions
const testQuestions = [
  'What is my ROAS in last 30 days?',
  'What is my total sales in last 30 days?',
  'What is my net profit in last 30 days?',
  'What is my delivery rate in last 30 days?',
  'What is my average order value in last 30 days?'
];

async function testQuestion(question, index) {
  try {
    console.log(`\n${index + 1}. Testing: "${question}"`);
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
    console.log(`   📊 Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    
    return { success: true, responseTime, tokens: data.usage?.total_tokens };

  } catch (error) {
    console.log('   ❌ FAILED');
    const errorMsg = error.response?.data?.error || error.message;
    console.log(`   Error: ${errorMsg}`);
    
    // Check if it's a quota error
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      console.log('   ⚠️  OpenAI API quota exceeded. Please:');
      console.log('      1. Wait a few minutes and try again');
      console.log('      2. Check your OpenAI billing at https://platform.openai.com/account/billing');
      console.log('      3. Upgrade your OpenAI plan if needed');
    }
    
    return { success: false, error: errorMsg };
  }
}

async function runQuickTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   AI CHATBOT - QUICK TEST (5 Questions)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check if server is running
  try {
    await axios.get('http://localhost:6000/');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running!');
    console.error('Please start: npm run dev\n');
    return;
  }

  const results = { total: 0, passed: 0, failed: 0, totalTime: 0, totalTokens: 0 };

  for (let i = 0; i < testQuestions.length; i++) {
    results.total++;
    const result = await testQuestion(testQuestions[i], i);
    
    if (result.success) {
      results.passed++;
      results.totalTime += result.responseTime;
      results.totalTokens += result.tokens || 0;
    } else {
      results.failed++;
      
      // If quota error, stop testing
      if (result.error.includes('429') || result.error.includes('quota')) {
        console.log('\n⚠️  Stopping test due to API quota limit.\n');
        break;
      }
    }
    
    // 3 second delay between requests
    if (i < testQuestions.length - 1) {
      console.log('   ⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   Total: ${results.total} | ✅ Passed: ${results.passed} | ❌ Failed: ${results.failed}`);
  
  if (results.passed > 0) {
    console.log(`   ⏱️  Avg Response: ${(results.totalTime / results.passed).toFixed(0)}ms`);
    console.log(`   📊 Avg Tokens: ${Math.round(results.totalTokens / results.passed)}`);
    console.log(`   💰 Est. Cost: $${((results.totalTokens / 1000) * 0.002).toFixed(4)}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════\n');

  if (results.passed === results.total) {
    console.log('🎉 All tests passed!\n');
  } else if (results.passed > 0) {
    console.log(`✅ ${results.passed} tests passed, ${results.failed} failed.\n`);
  } else {
    console.log('❌ All tests failed. Check errors above.\n');
  }
}

console.log('\nStarting Quick AI Test...\n');
runQuickTest().catch(error => {
  console.error('Fatal Error:', error.message);
});
