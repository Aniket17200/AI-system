const axios = require('axios');

const API_BASE = 'http://localhost:6000/api';
const USER_ID = '68c812b0afc4892c1f8128e3';

async function testSingleQuestion() {
  console.log('Testing single question with automatic fallback...\n');

  try {
    const response = await axios.post(`${API_BASE}/ai/chat`, {
      userId: USER_ID,
      message: 'What is my ROAS in last 30 days?'
    });

    const data = response.data;
    
    console.log('✅ SUCCESS!');
    console.log(`Service Used: ${data.mock ? 'Mock Service (No OpenAI)' : 'OpenAI'}`);
    console.log(`Answer: ${data.data.message}`);
    console.log('');
    
    if (data.mock) {
      console.log('💡 The mock service is working! You can use the chatbot without OpenAI credits.');
      console.log('   Add OpenAI credits later for AI-powered conversational responses.');
    } else {
      console.log('🎉 OpenAI is working! You have active credits.');
    }

  } catch (error) {
    console.log('❌ FAILED');
    console.log(`Error: ${error.response?.data?.error || error.message}`);
    console.log('');
    console.log('Please make sure:');
    console.log('1. Server is running (npm run dev)');
    console.log('2. Server has been restarted after code changes');
  }
}

testSingleQuestion();
