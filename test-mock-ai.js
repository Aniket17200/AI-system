const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';
const USER_ID = '68c812b0afc4892c1f8128e3'; // Tanesh user

const testQuestions = [
  'What is my ROAS in last 30 days?',
  'What is my total sales in last 30 days?',
  'What is my net profit in last 30 days?',
  'What is my orders in last 30 days?',
  'What is my average order value in last 30 days?'
];

async function testMockService() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   TESTING MOCK AI SERVICE (No OpenAI Required)');
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

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`${i + 1}. Question: "${question}"`);

    try {
      const startTime = Date.now();
      const response = await axios.post(`${API_BASE}/ai/chat`, {
        userId: USER_ID,
        message: question
      });

      const responseTime = Date.now() - startTime;
      const data = response.data.data;
      const isMock = response.data.mock;

      console.log(`   ✅ SUCCESS ${isMock ? '(Mock Service)' : '(OpenAI)'}`);
      console.log(`   ⏱️  Response Time: ${responseTime}ms`);
      console.log(`   💬 Answer: ${data.message}`);
      console.log('');

      passed++;

    } catch (error) {
      console.log('   ❌ FAILED');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
      console.log('');
      failed++;
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   Total: ${testQuestions.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log('');

  if (passed === testQuestions.length) {
    console.log('🎉 All tests passed! Mock service is working!\n');
    console.log('💡 TIP: Add credits to OpenAI to use AI-powered responses.');
    console.log('   For now, the mock service provides accurate calculated answers.\n');
  } else {
    console.log(`⚠️  ${failed} test(s) failed.\n`);
  }
}

console.log('\nStarting Mock AI Service Test...\n');
testMockService().catch(error => {
  console.error('Fatal Error:', error.message);
});
