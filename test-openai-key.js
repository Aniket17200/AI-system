require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAIKey() {
  try {
    console.log('🔑 Testing OpenAI API Key...\n');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('API Key:', process.env.OPENAI_API_KEY.substring(0, 20) + '...');
    console.log('\nSending test request to OpenAI...\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, OpenAI is working!"' }
      ],
      max_tokens: 50
    });

    console.log('✅ SUCCESS! OpenAI is working!\n');
    console.log('Response:', response.choices[0].message.content);
    console.log('\nTokens used:', response.usage.total_tokens);
    console.log('Model:', response.model);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.status === 429) {
      console.error('\n⚠️  Quota exceeded. Please check:');
      console.error('   1. OpenAI account has credits');
      console.error('   2. Billing is set up');
      console.error('   3. API key is valid');
      console.error('\n   Visit: https://platform.openai.com/account/billing');
    }
  }
}

testOpenAIKey();
