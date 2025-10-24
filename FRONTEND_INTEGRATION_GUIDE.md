# 🚀 Frontend Integration Guide - AI Chatbot API

## 📡 API Endpoint

```
POST http://localhost:5000/api/ai/chat
```

## 🔑 Required Headers

```
Content-Type: application/json
```

## 📤 Request Format

### Required Fields

```json
{
  "userId": "string",      // MongoDB ObjectId of the user
  "message": "string"      // User's question
}
```

### Optional Fields

```json
{
  "userId": "string",
  "message": "string",
  "conversationHistory": [  // Optional: for context-aware conversations
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "assistant",
      "content": "Previous answer"
    }
  ]
}
```

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Your total revenue in the last 30 days is ₹8,01,556.",
    "context": {
      "totalOrders": 470,
      "totalRevenue": 801556,
      "totalCOGS": 280544.6,
      "totalAdSpend": 39753.12,
      "totalShippingCost": 43383.6,
      "totalGrossProfit": 521011.4,
      "totalNetProfit": 437874.68,
      "grossProfitMargin": "65.00",
      "netProfitMargin": "54.63",
      "roas": "20.16",
      "poas": "11.01",
      "aov": "1705.44",
      "totalCustomers": 470,
      "newCustomers": 423,
      "returningCustomers": 47
    },
    "responseTime": 2165,
    "usage": {
      "prompt_tokens": 650,
      "completion_tokens": 45,
      "total_tokens": 695
    }
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🔧 cURL Examples

### Basic Request

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "68c812b0afc4892c1f8128e3",
    "message": "What is my total revenue in last 30 days?"
  }'
```

### With Conversation History

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "68c812b0afc4892c1f8128e3",
    "message": "What about last 60 days?",
    "conversationHistory": [
      {
        "role": "user",
        "content": "What is my revenue in last 30 days?"
      },
      {
        "role": "assistant",
        "content": "Your revenue in the last 30 days is ₹8,01,556."
      }
    ]
  }'
```

### Multiple Question Examples

```bash
# Revenue Question
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"68c812b0afc4892c1f8128e3","message":"What is my revenue in last 30 days?"}'

# ROAS Question
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"68c812b0afc4892c1f8128e3","message":"What is my ROAS in last 30 days?"}'

# Profit Question
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"68c812b0afc4892c1f8128e3","message":"What is my net profit and margin?"}'

# Orders Question
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"68c812b0afc4892c1f8128e3","message":"How many orders in last 30 days?"}'

# Business Overview
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"68c812b0afc4892c1f8128e3","message":"Give me a complete business overview"}'
```

## 💻 Frontend Integration Examples

### JavaScript (Fetch API)

```javascript
async function askAI(userId, question) {
  try {
    const response = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        message: question
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('AI Answer:', data.data.message);
      console.log('Response Time:', data.data.responseTime + 'ms');
      console.log('Context Data:', data.data.context);
      return data.data;
    } else {
      console.error('Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

// Usage
const userId = '68c812b0afc4892c1f8128e3';
const answer = await askAI(userId, 'What is my revenue in last 30 days?');
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

async function askAI(userId, question, conversationHistory = []) {
  try {
    const response = await axios.post('http://localhost:5000/api/ai/chat', {
      userId: userId,
      message: question,
      conversationHistory: conversationHistory
    });

    return {
      success: true,
      answer: response.data.data.message,
      context: response.data.data.context,
      responseTime: response.data.data.responseTime,
      usage: response.data.data.usage
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

// Usage
const result = await askAI(
  '68c812b0afc4892c1f8128e3',
  'What is my ROAS in last 30 days?'
);

if (result.success) {
  console.log(result.answer);
}
```

### React Component Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function AIChatbot({ userId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/ai/chat', {
        userId: userId,
        message: question,
        conversationHistory: conversationHistory
      });

      const aiAnswer = response.data.data.message;
      setAnswer(aiAnswer);

      // Update conversation history
      setConversationHistory([
        ...conversationHistory,
        { role: 'user', content: question },
        { role: 'assistant', content: aiAnswer }
      ]);

      setQuestion('');
    } catch (error) {
      setAnswer('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chatbot">
      <div className="chat-history">
        {conversationHistory.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        {answer && (
          <div className="message assistant">
            <strong>AI:</strong>
            <p>{answer}</p>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
          placeholder="Ask about your business metrics..."
          disabled={loading}
        />
        <button onClick={askQuestion} disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </div>
    </div>
  );
}

export default AIChatbot;
```

### Vue.js Component Example

```vue
<template>
  <div class="ai-chatbot">
    <div class="chat-history">
      <div 
        v-for="(msg, idx) in conversationHistory" 
        :key="idx" 
        :class="['message', msg.role]"
      >
        <strong>{{ msg.role === 'user' ? 'You' : 'AI' }}:</strong>
        <p>{{ msg.content }}</p>
      </div>
    </div>

    <div class="input-area">
      <input
        v-model="question"
        @keyup.enter="askQuestion"
        placeholder="Ask about your business metrics..."
        :disabled="loading"
      />
      <button @click="askQuestion" :disabled="loading">
        {{ loading ? 'Thinking...' : 'Ask' }}
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['userId'],
  data() {
    return {
      question: '',
      loading: false,
      conversationHistory: []
    };
  },
  methods: {
    async askQuestion() {
      if (!this.question.trim()) return;

      this.loading = true;

      try {
        const response = await axios.post('http://localhost:5000/api/ai/chat', {
          userId: this.userId,
          message: this.question,
          conversationHistory: this.conversationHistory
        });

        const aiAnswer = response.data.data.message;

        this.conversationHistory.push(
          { role: 'user', content: this.question },
          { role: 'assistant', content: aiAnswer }
        );

        this.question = '';
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

## 📊 Response Data Structure

### Main Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request was successful |
| `data.message` | string | AI's answer to the question |
| `data.context` | object | Aggregated metrics data |
| `data.responseTime` | number | Response time in milliseconds |
| `data.usage` | object | Token usage information |

### Context Object Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `totalOrders` | number | Total orders in period | 470 |
| `totalRevenue` | number | Total revenue | 801556 |
| `totalCOGS` | number | Cost of goods sold | 280544.6 |
| `totalAdSpend` | number | Advertising spend | 39753.12 |
| `totalShippingCost` | number | Shipping costs | 43383.6 |
| `totalGrossProfit` | number | Gross profit | 521011.4 |
| `totalNetProfit` | number | Net profit | 437874.68 |
| `grossProfitMargin` | string | Gross margin % | "65.00" |
| `netProfitMargin` | string | Net margin % | "54.63" |
| `roas` | string | Return on ad spend | "20.16" |
| `poas` | string | Profit on ad spend | "11.01" |
| `aov` | string | Average order value | "1705.44" |
| `totalCustomers` | number | Total customers | 470 |
| `newCustomers` | number | New customers | 423 |
| `returningCustomers` | number | Returning customers | 47 |

### Usage Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `prompt_tokens` | number | Tokens used in prompt |
| `completion_tokens` | number | Tokens used in response |
| `total_tokens` | number | Total tokens used |

## 🎯 Supported Question Types

### Revenue & Sales
```
"What is my revenue in last 30 days?"
"What is my total sales in last 60 days?"
"How many orders in last 90 days?"
"What is my average order value?"
```

### Marketing Metrics
```
"What is my ROAS in last 30 days?"
"What is my POAS in last 30 days?"
"How much I spend on ads?"
"What is my cost per purchase?"
"What is my CTR/CPC/CPM?"
```

### Profit & Financial
```
"What is my net profit and margin?"
"What is my gross profit?"
"What is my profit margin?"
```

### Customer Metrics
```
"What is my returning customer rate?"
"How many new customers?"
"Who are my top customers?"
```

### Shipping Metrics
```
"What is my delivery rate?"
"What is my RTO rate?"
"What is my shipping spend?"
"What is my average shipping cost?"
```

### Comparisons & Trends
```
"Compare my revenue in last 30 days vs last 60 days"
"Show me my revenue trend"
"What is my growth rate?"
"Give me a complete business overview"
```

## ⚡ Best Practices

### 1. Handle Loading States
```javascript
// Show loading indicator while waiting for response
setLoading(true);
const response = await askAI(userId, question);
setLoading(false);
```

### 2. Error Handling
```javascript
try {
  const response = await askAI(userId, question);
  if (response.success) {
    // Handle success
  } else {
    // Handle error
    showError(response.error);
  }
} catch (error) {
  // Handle network errors
  showError('Network error. Please try again.');
}
```

### 3. Maintain Conversation History
```javascript
// Keep last 6 messages (3 exchanges) for context
const history = conversationHistory.slice(-6);
```

### 4. Debounce Requests
```javascript
// Prevent multiple rapid requests
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const debouncedAsk = debounce(askQuestion, 500);
```

### 5. Display Response Time
```javascript
// Show users how fast the AI responds
console.log(`Response received in ${responseTime}ms`);
```

## 🔒 Security Considerations

### 1. Validate User ID
```javascript
// Always validate userId before sending
if (!userId || !isValidObjectId(userId)) {
  throw new Error('Invalid user ID');
}
```

### 2. Sanitize Input
```javascript
// Sanitize user input before sending
const sanitizedQuestion = question.trim().substring(0, 500);
```

### 3. Use HTTPS in Production
```javascript
// Production endpoint
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com/api/ai/chat'
  : 'http://localhost:5000/api/ai/chat';
```

### 4. Implement Rate Limiting
```javascript
// Limit requests per user
const MAX_REQUESTS_PER_MINUTE = 10;
```

## 📱 Mobile Integration

### React Native Example

```javascript
import axios from 'axios';

const askAI = async (userId, question) => {
  try {
    const response = await axios.post(
      'http://your-server.com/api/ai/chat',
      {
        userId: userId,
        message: question
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
};

// Usage in component
const [answer, setAnswer] = useState('');

const handleAsk = async () => {
  const result = await askAI(userId, question);
  setAnswer(result.message);
};
```

## 🧪 Testing

### Test with Different Users
```bash
# User 1
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"68c812b0afc4892c1f8128e3","message":"What is my revenue?"}'

# User 2
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"68fb223df39b1cbfd3de3bc4","message":"What is my revenue?"}'
```

### Test Different Time Periods
```bash
# 30 days
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","message":"What is my revenue in last 30 days?"}'

# 60 days
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","message":"What is my revenue in last 60 days?"}'

# 90 days
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","message":"What is my revenue in last 90 days?"}'
```

## 📈 Performance Tips

1. **Cache User Context**: Store userId in local storage/state
2. **Debounce Requests**: Wait 500ms before sending
3. **Show Loading States**: Improve perceived performance
4. **Limit History**: Keep only last 6 messages
5. **Handle Errors Gracefully**: Show user-friendly messages

## 🎉 Ready to Integrate!

Your AI chatbot API is ready for frontend integration with:
- ✅ Simple REST API endpoint
- ✅ JSON request/response format
- ✅ Conversation history support
- ✅ Fast response times (1-3 seconds)
- ✅ Comprehensive context data
- ✅ Multi-user support
- ✅ Production-ready

Start integrating with the examples above!
