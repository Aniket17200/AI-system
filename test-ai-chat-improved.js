require('dotenv').config();
const mongoose = require('mongoose');
const aiChatService = require('./services/aiChatService');

async function testImprovedAIChat() {
  try {
    console.log('🧪 Testing Improved AI Chat Service...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test with Tanesh's user ID
    const userId = '68c812b0afc4892c1f8128e3';

    // Test 1: General "last 30 days" question
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: General business performance question');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const question1 = "How's my business doing in the last 30 days?";
    console.log(`Question: "${question1}"\n`);
    
    const response1 = await aiChatService.chat(userId, question1);
    console.log('AI Response:');
    console.log(response1.message);
    console.log(`\n⏱️  Response time: ${response1.responseTime}ms`);
    console.log(`📊 Tokens used: ${response1.usage.total_tokens}\n`);

    // Test 2: Specific ROAS question
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Specific ROAS question');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const question2 = "What's my ROAS?";
    console.log(`Question: "${question2}"\n`);
    
    const response2 = await aiChatService.chat(userId, question2);
    console.log('AI Response:');
    console.log(response2.message);
    console.log(`\n⏱️  Response time: ${response2.responseTime}ms`);
    console.log(`📊 Tokens used: ${response2.usage.total_tokens}\n`);

    // Test 3: Orders question
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: Orders question');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const question3 = "How many orders did I get?";
    console.log(`Question: "${question3}"\n`);
    
    const response3 = await aiChatService.chat(userId, question3);
    console.log('AI Response:');
    console.log(response3.message);
    console.log(`\n⏱️  Response time: ${response3.responseTime}ms`);
    console.log(`📊 Tokens used: ${response3.usage.total_tokens}\n`);

    // Test 4: Profit margin question
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: Profit margin question');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const question4 = "What's my profit margin?";
    console.log(`Question: "${question4}"\n`);
    
    const response4 = await aiChatService.chat(userId, question4);
    console.log('AI Response:');
    console.log(response4.message);
    console.log(`\n⏱️  Response time: ${response4.responseTime}ms`);
    console.log(`📊 Tokens used: ${response4.usage.total_tokens}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

testImprovedAIChat();
