# 🚀 AI Chatbot API - Quick Reference

## 📡 Endpoint

```
POST http://localhost:5000/api/ai/chat
```

## 📤 Request

```json
{
  "userId": "68c812b0afc4892c1f8128e3",
  "message": "What is my revenue in last 30 days?"
}
```

## 📥 Response

```json
{
  "success": true,
  "data": {
    "message": "Your revenue in the last 30 days is ₹8,01,556.",
    "context": {
      "totalOrders": 470,
      "totalRevenue": 801556,
      "totalNetProfit": 437874.68,
      "netProfitMargin": "54.63",
      "roas": "20.16"
    },
    "responseTime": 2165,
    "usage": {
      "total_tokens": 695
    }
  }
}
```

## 💻 JavaScript Example

```javascript
const response = await fetch('http://localhost:5000/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '68c812b0afc4892c1f8128e3',
    message: 'What is my revenue in last 30 days?'
  })
});

const data = await response.json();
console.log(data.data.message); // AI's answer
```

## 🔧 cURL Example

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "68c812b0afc4892c1f8128e3",
    "message": "What is my revenue in last 30 days?"
  }'
```

## 📊 What You Get

| Field | Description | Example |
|-------|-------------|---------|
| `message` | AI's answer | "Your revenue in the last 30 days is ₹8,01,556." |
| `context.totalRevenue` | Total revenue | 801556 |
| `context.totalOrders` | Total orders | 470 |
| `context.netProfitMargin` | Net margin % | "54.63" |
| `context.roas` | Return on ad spend | "20.16" |
| `responseTime` | Response time (ms) | 2165 |

## 🎯 Sample Questions

```javascript
// Revenue
"What is my revenue in last 30 days?"
"What is my total sales in last 60 days?"

// Marketing
"What is my ROAS in last 30 days?"
"How much I spend on ads?"
"What is my cost per purchase?"

// Profit
"What is my net profit and margin?"
"What is my gross profit in last 90 days?"

// Orders
"How many orders in last 30 days?"
"What is my average order value?"

// Comparisons
"Compare my revenue in last 30 days vs last 60 days"
"Give me a complete business overview"
```

## ⚡ Quick Integration

### React

```jsx
const [answer, setAnswer] = useState('');

const askAI = async (question) => {
  const res = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      message: question
    })
  });
  const data = await res.json();
  setAnswer(data.data.message);
};
```

### Vue

```javascript
async askAI(question) {
  const res = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: this.userId,
      message: question
    })
  });
  const data = await res.json();
  this.answer = data.data.message;
}
```

### Axios

```javascript
const { data } = await axios.post('http://localhost:5000/api/ai/chat', {
  userId: userId,
  message: question
});
console.log(data.data.message);
```

## 🔒 Important Notes

1. **User ID Required**: Always send valid MongoDB ObjectId
2. **Response Time**: Typically 1-3 seconds
3. **Token Usage**: ~700 tokens per request
4. **Cost**: ~$0.014 per question
5. **Rate Limit**: Implement on frontend (10 req/min recommended)

## 🎉 That's It!

Simple POST request → Get AI answer → Display to user

See `FRONTEND_INTEGRATION_GUIDE.md` for detailed examples.
