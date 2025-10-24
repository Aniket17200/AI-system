# 🚀 Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MongoDB
**Option A: Local MongoDB**
```bash
# Install MongoDB and start it
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env` with connection string

### 3. Configure Environment
Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/profitfirstuser
NODE_ENV=production
```

### 4. Start Server
```bash
npm run dev
```

You should see:
```
[SUCCESS] Server running on port 5000
[INFO] Starting automatic sync scheduler
```

## 🎯 First Time Usage

### Step 1: Create Your First User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "shopifyStore": "e23104-8c.myshopify.com",
    "shopifyAccessToken": "YOUR_SHOPIFY_ACCESS_TOKEN",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "email": "your@email.com",
    "shopifyStore": "e23104-8c.myshopify.com",
    "isActive": true
  }
}
```

**Save the `_id` - you'll need it!**

### Step 2: Add Product Costs (Optional but Recommended)
```bash
curl -X POST http://localhost:5000/api/product-costs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "671234567890abcdef123456",
    "shopifyProductId": "123456789",
    "productName": "Product A",
    "cost": 100
  }'
```

**Note:** If you don't add product costs, the system will auto-estimate them as 40% of the selling price.

### Step 3: Trigger Manual Sync
```bash
curl -X POST http://localhost:5000/api/sync/manual \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "671234567890abcdef123456",
    "startDate": "2024-10-01",
    "endDate": "2024-10-31"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recordsSynced": 31,
    "errors": []
  }
}
```

### Step 4: View Your Metrics
```bash
curl "http://localhost:5000/api/metrics/summary/671234567890abcdef123456?days=30"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "revenue": 45000,
    "cogs": 27000,
    "grossProfit": 18000,
    "netProfit": 12450,
    "grossProfitMargin": 40,
    "netProfitMargin": 27.67,
    "roas": 12.86,
    "poas": 3.56,
    "aov": 300
  }
}
```

## 🔄 Automatic Sync

The system automatically syncs data **every hour** for all active users. No manual intervention needed!

To check sync status:
```bash
curl "http://localhost:5000/api/sync/jobs/671234567890abcdef123456"
```

## 📊 Using the Data

### Get Daily Breakdown
```bash
curl "http://localhost:5000/api/metrics?userId=YOUR_USER_ID&startDate=2024-10-01&endDate=2024-10-31"
```

### Get Summary
```bash
# Last 30 days
curl "http://localhost:5000/api/metrics/summary/YOUR_USER_ID?days=30"

# Last 7 days
curl "http://localhost:5000/api/metrics/summary/YOUR_USER_ID?days=7"
```

## 🔧 Troubleshooting

### Server won't start?
- Check if MongoDB is running
- Verify `.env` file exists
- Check port 5000 is not in use

### No data syncing?
- Verify user `isActive: true`
- Check Shopify credentials are correct
- View logs in `logs/` folder

### API errors?
- Check API credentials
- Verify date format (YYYY-MM-DD)
- Check logs for detailed errors

## 📝 View Logs
```bash
# Windows
type logs\2024-10-20.log

# Linux/Mac
cat logs/2024-10-20.log
```

## 🎉 You're All Set!

The system is now:
- ✅ Automatically fetching data every hour
- ✅ Calculating all Profit First metrics
- ✅ Storing data in MongoDB
- ✅ Logging all operations

Check the README.md for complete API documentation.
