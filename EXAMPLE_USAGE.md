# 📚 Example Usage & Scenarios

## Real-World Usage Examples

### Scenario 1: New E-commerce Store Setup

**Context:** You just launched your Shopify store and want to track profits.

```bash
# Step 1: Create user account
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "store@myshop.com",
    "shopifyStore": "myshop.myshopify.com",
    "shopifyAccessToken": "shpat_xxxxx",
    "isActive": true
  }'

# Response: Save the userId
# { "success": true, "data": { "_id": "671abc...", ... } }

# Step 2: Add your product costs
curl -X POST http://localhost:5000/api/product-costs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "671abc...",
    "shopifyProductId": "7891234567890",
    "productName": "T-Shirt",
    "cost": 200
  }'

# Step 3: Sync your data
curl -X POST http://localhost:5000/api/sync/manual \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "671abc...",
    "startDate": "2024-10-01",
    "endDate": "2024-10-31"
  }'

# Step 4: View your metrics
curl "http://localhost:5000/api/metrics/summary/671abc...?days=30"
```

### Scenario 2: Adding Meta Ads Tracking

**Context:** You're running Facebook ads and want to track ROAS.

```bash
# Update user with Meta credentials
curl -X PUT http://localhost:5000/api/users/671abc... \
  -H "Content-Type: application/json" \
  -d '{
    "metaAccessToken": "EAAxxxxxxxxxxxx",
    "metaAdAccountId": "act_123456789"
  }'

# Sync again to fetch ad data
curl -X POST http://localhost:5000/api/sync/manual \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "671abc...",
    "startDate": "2024-10-01",
    "endDate": "2024-10-31"
  }'

# View metrics with ROAS
curl "http://localhost:5000/api/metrics/summary/671abc...?days=30"
# Response includes: roas, poas, cpc, ctr, cpm, etc.
```

### Scenario 3: Monitoring Shipping Performance

**Context:** You want to track delivery rates and RTO.

```bash
# Add Shiprocket credentials
curl -X PUT http://localhost:5000/api/users/671abc... \
  -H "Content-Type: application/json" \
  -d '{
    "shiprocketEmail": "your@email.com",
    "shiprocketPassword": "your_password"
  }'

# Sync to get shipping data
curl -X POST http://localhost:5000/api/sync/manual \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "671abc...",
    "startDate": "2024-10-01",
    "endDate": "2024-10-31"
  }'

# View daily metrics with shipping data
curl "http://localhost:5000/api/metrics?userId=671abc...&startDate=2024-10-01&endDate=2024-10-31"
# Response includes: deliveryRate, rtoRate, totalShipments, etc.
```

### Scenario 4: Checking Sync Status

**Context:** You want to monitor if syncs are running successfully.

```bash
# Get recent sync jobs
curl "http://localhost:5000/api/sync/jobs/671abc..."

# Response:
# [
#   {
#     "jobId": "sync_671abc..._1729425600000",
#     "status": "completed",
#     "recordsSynced": 31,
#     "errors": [],
#     "startedAt": "2024-10-20T10:00:00.000Z",
#     "completedAt": "2024-10-20T10:02:15.000Z"
#   }
# ]

# Check specific job
curl "http://localhost:5000/api/sync/status/sync_671abc..._1729425600000"
```

### Scenario 5: Analyzing Performance Trends

**Context:** You want to see how your business performed over time.

```bash
# Get last 7 days summary
curl "http://localhost:5000/api/metrics/summary/671abc...?days=7"

# Get last 30 days summary
curl "http://localhost:5000/api/metrics/summary/671abc...?days=30"

# Get daily breakdown for specific period
curl "http://localhost:5000/api/metrics?userId=671abc...&startDate=2024-10-01&endDate=2024-10-31"

# Response includes daily data:
# [
#   {
#     "date": "2024-10-01",
#     "revenue": 1500,
#     "netProfit": 450,
#     "netProfitMargin": 30,
#     "totalOrders": 5,
#     ...
#   },
#   ...
# ]
```

## Common API Response Examples

### Successful User Creation
```json
{
  "success": true,
  "data": {
    "_id": "671abc123def456789012345",
    "email": "store@myshop.com",
    "shopifyStore": "myshop.myshopify.com",
    "isActive": true,
    "createdAt": "2024-10-20T10:00:00.000Z",
    "updatedAt": "2024-10-20T10:00:00.000Z"
  }
}
```

### Successful Sync
```json
{
  "success": true,
  "data": {
    "recordsSynced": 31,
    "errors": []
  }
}
```

### Metrics Summary Response
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "revenue": 45000,
    "cogs": 27000,
    "adSpend": 3500,
    "shippingCost": 2050,
    "grossProfit": 18000,
    "netProfit": 12450,
    "grossProfitMargin": 40,
    "netProfitMargin": 27.67,
    "roas": 12.86,
    "poas": 3.56,
    "aov": 300,
    "totalCustomers": 120,
    "newCustomers": 80,
    "returningCustomers": 40
  },
  "days": 30,
  "dailyMetrics": [...]
}
```

### Daily Metrics Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "671def...",
      "userId": "671abc...",
      "date": "2024-10-01T00:00:00.000Z",
      "totalOrders": 5,
      "revenue": 1500,
      "cogs": 900,
      "adSpend": 120,
      "shippingCost": 80,
      "grossProfit": 600,
      "grossProfitMargin": 40,
      "netProfit": 400,
      "netProfitMargin": 26.67,
      "roas": 12.5,
      "poas": 3.33,
      "aov": 300,
      "cpp": 24,
      "cpc": 2.4,
      "ctr": 2.5,
      "cpm": 60,
      "reach": 2000,
      "impressions": 5000,
      "linkClicks": 50,
      "newCustomers": 3,
      "returningCustomers": 2,
      "totalCustomers": 5,
      "returningRate": 40,
      "totalShipments": 5,
      "delivered": 4,
      "inTransit": 1,
      "rto": 0,
      "ndr": 0,
      "deliveryRate": 80,
      "rtoRate": 0
    }
  ],
  "totals": {
    "totalOrders": 150,
    "revenue": 45000,
    "cogs": 27000,
    "adSpend": 3500,
    "shippingCost": 2050,
    "grossProfit": 18000,
    "netProfit": 12450
  },
  "count": 31
}
```

### Error Response Examples

**Validation Error:**
```json
{
  "success": false,
  "error": "Missing required fields: email, shopifyStore, shopifyAccessToken"
}
```

**Not Found Error:**
```json
{
  "success": false,
  "error": "User not found"
}
```

**API Error:**
```json
{
  "success": false,
  "error": "Shopify API Error: Invalid access token"
}
```

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Create user
async function createUser() {
  const response = await axios.post(`${API_BASE}/users`, {
    email: 'store@myshop.com',
    shopifyStore: 'myshop.myshopify.com',
    shopifyAccessToken: 'shpat_xxxxx',
    isActive: true
  });
  return response.data.data._id;
}

// Sync data
async function syncData(userId) {
  const response = await axios.post(`${API_BASE}/sync/manual`, {
    userId,
    startDate: '2024-10-01',
    endDate: '2024-10-31'
  });
  return response.data;
}

// Get metrics
async function getMetrics(userId, days = 30) {
  const response = await axios.get(`${API_BASE}/metrics/summary/${userId}?days=${days}`);
  return response.data.data;
}

// Usage
(async () => {
  const userId = await createUser();
  await syncData(userId);
  const metrics = await getMetrics(userId);
  console.log('Metrics:', metrics);
})();
```

### Python
```python
import requests

API_BASE = 'http://localhost:5000/api'

# Create user
def create_user():
    response = requests.post(f'{API_BASE}/users', json={
        'email': 'store@myshop.com',
        'shopifyStore': 'myshop.myshopify.com',
        'shopifyAccessToken': 'shpat_xxxxx',
        'isActive': True
    })
    return response.json()['data']['_id']

# Sync data
def sync_data(user_id):
    response = requests.post(f'{API_BASE}/sync/manual', json={
        'userId': user_id,
        'startDate': '2024-10-01',
        'endDate': '2024-10-31'
    })
    return response.json()

# Get metrics
def get_metrics(user_id, days=30):
    response = requests.get(f'{API_BASE}/metrics/summary/{user_id}?days={days}')
    return response.json()['data']

# Usage
user_id = create_user()
sync_data(user_id)
metrics = get_metrics(user_id)
print('Metrics:', metrics)
```

### Frontend (React)
```javascript
import { useState, useEffect } from 'react';

function Dashboard({ userId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [userId]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/metrics/summary/${userId}?days=30`
      );
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Profit Dashboard</h1>
      <div>Revenue: ₹{metrics.revenue}</div>
      <div>Net Profit: ₹{metrics.netProfit}</div>
      <div>Net Margin: {metrics.netProfitMargin.toFixed(2)}%</div>
      <div>ROAS: {metrics.roas.toFixed(2)}x</div>
      <div>AOV: ₹{metrics.aov.toFixed(2)}</div>
    </div>
  );
}
```

## Automation Examples

### Daily Report Script
```bash
#!/bin/bash
# daily-report.sh

USER_ID="671abc123def456789012345"
API_BASE="http://localhost:5000/api"

# Get yesterday's metrics
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

curl -s "${API_BASE}/metrics?userId=${USER_ID}&startDate=${YESTERDAY}&endDate=${YESTERDAY}" \
  | jq '.data[0] | {
      date: .date,
      revenue: .revenue,
      netProfit: .netProfit,
      orders: .totalOrders,
      roas: .roas
    }'
```

### Weekly Summary Email
```javascript
const nodemailer = require('nodemailer');
const axios = require('axios');

async function sendWeeklySummary(userId, email) {
  // Get last 7 days metrics
  const response = await axios.get(
    `http://localhost:5000/api/metrics/summary/${userId}?days=7`
  );
  const metrics = response.data.data;

  // Send email
  const transporter = nodemailer.createTransporter({...});
  await transporter.sendMail({
    to: email,
    subject: 'Weekly Profit Summary',
    html: `
      <h2>Last 7 Days Performance</h2>
      <p>Revenue: ₹${metrics.revenue}</p>
      <p>Net Profit: ₹${metrics.netProfit}</p>
      <p>Margin: ${metrics.netProfitMargin.toFixed(2)}%</p>
      <p>Orders: ${metrics.totalOrders}</p>
    `
  });
}
```

## Tips & Best Practices

1. **Always save the userId** after creating a user
2. **Add product costs** for accurate COGS calculations
3. **Monitor sync jobs** to ensure data is updating
4. **Use date ranges** appropriate for your analysis
5. **Check logs** if something goes wrong
6. **Keep credentials secure** - never commit .env file
7. **Use summary endpoint** for quick overviews
8. **Use daily metrics** for detailed analysis
9. **Set isActive: false** to pause syncing for a user
10. **Backup your MongoDB** regularly
