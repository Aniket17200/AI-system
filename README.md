# ProfitFirst Backend API - Production Ready

Enterprise-grade backend system with automatic data syncing from Shopify, Meta Ads, and Shiprocket APIs. Calculates all Profit First metrics with proper error handling, logging, and retry logic.

## 🚀 Features

- ✅ **Automatic Data Sync** - Runs every hour automatically
- ✅ **Production Architecture** - Proper error handling, logging, validation
- ✅ **Retry Logic** - Auto-retry failed API calls with exponential backoff
- ✅ **Auto Product Cost Sync** - Automatically estimates product costs from Shopify
- ✅ **Comprehensive Logging** - Daily log files with detailed tracking
- ✅ **Job Tracking** - Monitor sync status and history
- ✅ **Data Validation** - Input validation on all endpoints
- ✅ **Error Recovery** - Continues processing even if one API fails

## 📦 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/profitfirstuser
NODE_ENV=production
```

### 3. Start MongoDB
Ensure MongoDB is running locally or use a cloud instance (MongoDB Atlas)

### 4. Run Server
```bash
# Development
npm run dev

# Production
npm start
```

## 🔄 Automatic Sync

The system automatically syncs data **every hour** for all active users. It:
1. Fetches last 30 days of data
2. Calls Shopify, Meta Ads, and Shiprocket APIs
3. Calculates all metrics
4. Stores numerical data in database
5. Logs all operations

## 📡 API Endpoints

### Users

**Create User**
```bash
POST /api/users
{
  "email": "user@example.com",
  "shopifyStore": "e23104-8c.myshopify.com",
  "shopifyAccessToken": "shpat_xxx",
  "metaAccessToken": "EAAxx",
  "metaAdAccountId": "act_123456",
  "shiprocketEmail": "email@example.com",
  "shiprocketPassword": "password"
}
```

**Get All Users**
```bash
GET /api/users
```

**Get User**
```bash
GET /api/users/:id
```

**Update User**
```bash
PUT /api/users/:id
{
  "isActive": true
}
```

### Product Costs

**Add/Update Product Cost**
```bash
POST /api/product-costs
{
  "userId": "USER_ID",
  "shopifyProductId": "123456789",
  "productName": "Product A",
  "cost": 100
}
```

**Get Product Costs**
```bash
GET /api/product-costs/:userId
```

**Delete Product Cost**
```bash
DELETE /api/product-costs/:id
```

### Sync Operations

**Manual Sync**
```bash
POST /api/sync/manual
{
  "userId": "USER_ID",
  "startDate": "2024-10-01",
  "endDate": "2024-10-31"
}
```

**Get Sync Jobs**
```bash
GET /api/sync/jobs/:userId
```

**Get Job Status**
```bash
GET /api/sync/status/:jobId
```

### Metrics

**Get Daily Metrics**
```bash
GET /api/metrics?userId=USER_ID&startDate=2024-10-01&endDate=2024-10-31
```

**Get Summary**
```bash
GET /api/metrics/summary/:userId?days=30
```

## 📊 Calculated Metrics

All metrics from Profit First formula documentation:

### Financial
- Revenue, COGS, Gross Profit, Net Profit
- Gross Profit Margin, Net Profit Margin

### Marketing
- ROAS, POAS, AOV, CPP
- CPC, CTR, CPM
- Reach, Impressions, Link Clicks

### Customers
- Total, New, Returning Customers
- Returning Rate

### Shipping
- Total Shipments, Delivered, In-Transit, RTO, NDR
- Delivery Rate, RTO Rate

## 🏗️ Architecture

```
├── config/
│   ├── db.js              # MongoDB connection
│   └── logger.js          # Logging system
├── middleware/
│   ├── errorHandler.js    # Global error handling
│   └── validation.js      # Input validation
├── models/
│   ├── User.js            # User credentials
│   ├── ProductCost.js     # Product costs for COGS
│   ├── DailyMetrics.js    # Daily calculated metrics
│   └── SyncJob.js         # Sync job tracking
├── services/
│   ├── shopifyService.js  # Shopify API integration
│   ├── metaAdsService.js  # Meta Ads API integration
│   ├── shiprocketService.js # Shiprocket API integration
│   ├── dataSyncService.js # Data sync orchestration
│   └── syncScheduler.js   # Automatic scheduling
├── utils/
│   └── calculations.js    # All profit formulas
├── routes/
│   └── index.js           # API routes
└── server.js              # Application entry point
```

## 🔒 Security Features

- API credentials stored securely in database
- Sensitive fields excluded from API responses
- Input validation on all endpoints
- Error messages don't expose sensitive data
- Environment variables for configuration

## 📝 Logging

Logs are stored in `logs/` directory:
- Daily log files (YYYY-MM-DD.log)
- JSON format for easy parsing
- Includes timestamps, levels, and metadata
- Console output with color coding

## 🔄 Error Handling

- Retry logic with exponential backoff (3 attempts)
- Continues processing if one API fails
- Detailed error logging
- Job status tracking
- Graceful degradation

## 🎯 Production Best Practices

✅ Proper error handling and recovery
✅ Comprehensive logging
✅ Input validation
✅ Retry logic for API calls
✅ Job tracking and monitoring
✅ Automatic sync scheduling
✅ Clean architecture with separation of concerns
✅ Environment-based configuration
✅ Security best practices

## 📈 Monitoring

Check sync status:
```bash
# Get recent sync jobs
GET /api/sync/jobs/:userId

# Check specific job
GET /api/sync/status/:jobId
```

View logs:
```bash
# Check today's log
cat logs/2024-10-20.log
```

## 🚨 Troubleshooting

**Sync not running?**
- Check MongoDB connection
- Verify user `isActive: true`
- Check logs for errors

**API errors?**
- Verify API credentials in user record
- Check API rate limits
- Review error logs

**Missing data?**
- Ensure product costs are set
- Check date ranges
- Verify API permissions
