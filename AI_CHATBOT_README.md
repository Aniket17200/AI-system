# 🤖 AI Chatbot for ProfitFirst Analytics

## Overview

An intelligent AI chatbot powered by OpenAI GPT-4 and Pinecone vector database that provides natural language insights into your e-commerce business metrics.

## Features

✅ **Natural Language Queries** - Ask questions in plain English
✅ **Real-time Data Analysis** - Analyzes your actual business metrics
✅ **Contextual Responses** - Maintains conversation history
✅ **Actionable Insights** - Provides specific recommendations
✅ **Multi-metric Support** - Revenue, profit, marketing, customers, etc.

## Setup

### 1. Environment Variables

Already configured in `.env`:
```env
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=pcsk_...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=profitfirst-analytics
```

### 2. Create Pinecone Index

1. Go to https://app.pinecone.io/
2. Create a new index:
   - Name: `profitfirst-analytics`
   - Dimensions: `1536` (for OpenAI ada-002 embeddings)
   - Metric: `cosine`
   - Environment: `us-east-1`

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Server

```bash
npm run dev
```

## API Endpoints

### 1. Chat with AI

```bash
POST /api/ai/chat
Content-Type: application/json

{
  "userId": "68c812b0afc4892c1f8128e3",
  "message": "What's my revenue for the last 30 days?",
  "conversationHistory": []  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Your total revenue for the last 30 days is ₹4,23,057. This comes from 250 orders with an average order value of ₹1,692.",
    "context": {
      "summary": { ... },
      "recentMetrics": [ ... ]
    },
    "usage": {
      "prompt_tokens": 450,
      "completion_tokens": 120,
      "total_tokens": 570
    }
  }
}
```

### 2. Index Metrics (Optional)

Index user metrics in Pinecone for better semantic search:

```bash
POST /api/ai/index/68c812b0afc4892c1f8128e3
```

### 3. Get Suggested Questions

```bash
GET /api/ai/suggestions/68c812b0afc4892c1f8128e3
```

## Example Questions

### Revenue & Sales
- "What's my total revenue for the last 30 days?"
- "Show me my revenue trend"
- "What was my best selling day?"
- "How much did I make this week?"

### Profit Analysis
- "What's my profit margin?"
- "How is my net profit performing?"
- "Am I making good profit?"
- "What are my biggest expenses?"

### Marketing Performance
- "What's my ROAS?"
- "How effective are my ads?"
- "Should I increase my ad spend?"
- "What's my cost per acquisition?"

### Customer Insights
- "How many customers do I have?"
- "What's my customer retention rate?"
- "How many new vs returning customers?"
- "How can I improve customer retention?"

### Comparisons
- "Compare this week vs last week"
- "How is this month performing?"
- "What's my growth rate?"

## Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function askAI(question) {
  const response = await axios.post('http://localhost:5000/api/ai/chat', {
    userId: '68c812b0afc4892c1f8128e3',
    message: question
  });
  
  console.log(response.data.data.message);
}

askAI("What's my revenue?");
```

### Python

```python
import requests

def ask_ai(question):
    response = requests.post('http://localhost:5000/api/ai/chat', json={
        'userId': '68c812b0afc4892c1f8128e3',
        'message': question
    })
    return response.json()['data']['message']

print(ask_ai("What's my profit margin?"))
```

### cURL

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "68c812b0afc4892c1f8128e3",
    "message": "What is my ROAS?"
  }'
```

## Conversation Flow

The chatbot maintains context across messages:

```javascript
// First message
POST /api/ai/chat
{
  "userId": "...",
  "message": "What's my revenue?"
}
// Response: "Your revenue is ₹4,23,057"

// Follow-up message with history
POST /api/ai/chat
{
  "userId": "...",
  "message": "What about profit?",
  "conversationHistory": [
    { "role": "user", "content": "What's my revenue?" },
    { "role": "assistant", "content": "Your revenue is ₹4,23,057" }
  ]
}
// Response: "Your net profit is ₹2,53,138 with a 59.84% margin"
```

## How It Works

1. **User Query** → Receives natural language question
2. **Data Retrieval** → Fetches relevant metrics from MongoDB
3. **Context Building** → Calculates summaries and extracts relevant data
4. **AI Processing** → Sends to GPT-4 with business context
5. **Response** → Returns natural language answer with insights

## Features in Detail

### Smart Context Extraction

The AI automatically identifies what data is relevant based on your question:

- **Revenue questions** → Returns daily revenue breakdown
- **Profit questions** → Returns profit margins and trends
- **Marketing questions** → Returns ROAS, ad spend, reach
- **Customer questions** → Returns retention and acquisition data

### Actionable Insights

The AI doesn't just report numbers, it provides:
- ✅ Performance analysis
- ✅ Trend identification
- ✅ Improvement suggestions
- ✅ Benchmarking context

### Multi-metric Analysis

Answers complex questions like:
- "How can I improve my profit?"
- "Is my marketing effective?"
- "What should I focus on?"

## Cost Estimation

### OpenAI Costs (GPT-4 Turbo)
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- Average query: ~$0.02-0.05

### Pinecone Costs
- Free tier: 1 index, 100K vectors
- Paid: $70/month for 1M vectors

## Best Practices

1. **Keep conversations focused** - One topic per conversation
2. **Provide context** - Include conversation history for follow-ups
3. **Be specific** - "Last 7 days" vs "recently"
4. **Ask follow-ups** - Dig deeper into insights

## Troubleshooting

### "OpenAI API Error"
- Check API key is valid
- Ensure you have credits
- Verify API key has GPT-4 access

### "Pinecone Error"
- Verify index exists
- Check index dimensions (1536)
- Confirm API key is correct

### "No data available"
- Ensure metrics are synced
- Check date range has data
- Verify userId is correct

## Integration Examples

### React Frontend

```jsx
import { useState } from 'react';

function ChatBot({ userId }) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const sendMessage = async () => {
    const response = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message,
        conversationHistory: history
      })
    });
    
    const data = await response.json();
    setHistory([
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: data.data.message }
    ]);
  };

  return (
    <div>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
      <div>
        {history.map((msg, i) => (
          <div key={i}>{msg.role}: {msg.content}</div>
        ))}
      </div>
    </div>
  );
}
```

## Future Enhancements

- [ ] Voice input/output
- [ ] Chart generation
- [ ] Automated insights
- [ ] Predictive analytics
- [ ] Multi-language support
- [ ] Custom training on business data

## Support

For issues or questions:
1. Check logs: `logs/YYYY-MM-DD.log`
2. Verify API keys
3. Test with simple questions first

---

**Your AI business analyst is ready to help! 🚀**
