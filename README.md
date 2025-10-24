# ProfitFirst AI Analytics System - Production Ready

Enterprise-grade backend system with AI-powered chatbot, automatic data syncing from Shopify, Meta Ads, and Shiprocket APIs. Features intelligent conversational analytics with OpenAI GPT-4 and Pinecone vector database for semantic search.

## 🚀 Features

### Core Features
- ✅ **AI Chatbot** - Natural language queries with GPT-4 and Pinecone vector search
- ✅ **Automatic Data Sync** - Runs every 30 minutes for all active users
- ✅ **Cloud Database** - MongoDB Atlas cluster with global availability
- ✅ **Production Architecture** - Proper error handling, logging, validation
- ✅ **Retry Logic** - Auto-retry failed API calls with exponential backoff
- ✅ **Auto Product Cost Sync** - Automatically estimates product costs from Shopify
- ✅ **Comprehensive Logging** - Daily log files with detailed tracking
- ✅ **Job Tracking** - Monitor sync status and history
- ✅ **Data Validation** - Input validation on all endpoints
- ✅ **Error Recovery** - Continues processing even if one API fails

### AI Capabilities
- Natural language business queries
- Intelligent metric analysis
- Contextual recommendations
- Multi-user support with data isolation
- Semantic search across historical data

## 📦 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file with the following configuration:

```env
# Server Configuration
PORT=6000
NODE_ENV=production

# MongoDB Atlas Cloud Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ufhmr.mongodb.net/profitfirst?retryWrites=true&w=majority&appName=Cluster0

# OpenAI Configuration (for AI Chatbot)
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY

# Pinecone Configuration (for Vector Search)
PINECONE_API_KEY=pcsk_YOUR_PINECONE_API_KEY
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=profitfirst-analytics

# Data Sync Configuration
DATA_SYNC_INTERVAL=30
CACHE_TTL_MINUTES=30
```

### 3. MongoDB Atlas Setup

This project uses **MongoDB Atlas** cloud database for production deployment:

#### Database Details
- **Cluster**: Cluster0 (M0 Free Tier or higher)
- **Region**: AWS / us-east-1 (or your preferred region)
- **Database Name**: profitfirst
- **Collections**:
  - `users` - User credentials and API tokens
  - `dailymetrics` - Daily calculated business metrics
  - `productcosts` - Product cost data for COGS calculations
  - `syncjobs` - Sync job tracking and history

#### Setup Steps
1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (M0 Free Tier works for development)
3. Configure network access (add your IP or allow from anywhere: 0.0.0.0/0)
4. Create database user with read/write permissions
5. Get connection string and update `MONGODB_URI` in `.env`
6. Database and collections are created automatically on first run

#### Connection String Format
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 4. OpenAI Setup
1. Create account at https://platform.openai.com
2. Generate API key from API Keys section
3. Add to `.env` as `OPENAI_API_KEY`
4. Ensure you have credits/billing enabled

### 5. Pinecone Setup
1. Create account at https://www.pinecone.io
2. Create a new index named `profitfirst-analytics`
   - Dimensions: 1536 (for OpenAI embeddings)
   - Metric: cosine
3. Get API key and add to `.env`

### 6. Run Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:6000`

## 🔄 Automatic Sync

The system automatically syncs data **every 30 minutes** for all active users. It:
1. Fetches last 30 days of data from all integrated platforms
2. Calls Shopify, Meta Ads, and Shiprocket APIs
3. Calculates all Profit First metrics
4. Stores data in MongoDB Atlas cloud database
5. Updates Pinecone vector database for AI queries
6. Logs all operations with detailed tracking

## 🤖 AI Chatbot

### Natural Language Queries
Ask business questions in plain English:
- "What was my revenue last week?"
- "Show me profit trends for October"
- "How is my ROAS performing?"
- "What's my best selling product?"
- "Compare this month vs last month"

### Supported Question Types
- Revenue and profit analysis
- Marketing performance (ROAS, POAS, CPC, CTR)
- Customer metrics (new, returning, retention)
- Shipping analytics (delivery rates, RTO)
- Product performance
- Time-based comparisons
- Trend analysis

### AI Endpoint
```bash
POST /api/chat
{
  "userId": "USER_ID",
  "message": "What was my revenue last week?"
}
```

Response includes:
- Natural language answer
- Relevant metrics and data
- Contextual insights
- Recommendations (when applicable)

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
│   ├── db.js              # MongoDB Atlas cloud connection
│   └── logger.js          # Logging system
├── middleware/
│   ├── errorHandler.js    # Global error handling
│   └── validation.js      # Input validation
├── models/
│   ├── User.js            # User credentials & API tokens
│   ├── ProductCost.js     # Product costs for COGS
│   ├── DailyMetrics.js    # Daily calculated metrics
│   └── SyncJob.js         # Sync job tracking
├── services/
│   ├── aiChatService.js   # AI chatbot with GPT-4 & Pinecone
│   ├── shopifyService.js  # Shopify API integration
│   ├── metaAdsService.js  # Meta Ads API integration
│   ├── shiprocketService.js # Shiprocket API integration
│   ├── dataSyncService.js # Data sync orchestration
│   └── syncScheduler.js   # Automatic scheduling (30 min)
├── utils/
│   └── calculations.js    # All profit formulas
├── routes/
│   ├── index.js           # Main API routes
│   └── chatRoutes.js      # AI chatbot routes
└── server.js              # Application entry point
```

### Technology Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (Cloud)
- **AI**: OpenAI GPT-4 + Pinecone Vector DB
- **APIs**: Shopify, Meta Ads, Shiprocket
- **Logging**: Winston (daily rotation)
- **Scheduling**: Node-cron (30-minute intervals)

## 🔒 Security Features

- **Cloud Database**: MongoDB Atlas with encryption at rest and in transit
- **API Credentials**: Stored securely in database, never exposed in responses
- **Environment Variables**: All sensitive keys in `.env` (excluded from git)
- **Input Validation**: All endpoints validated before processing
- **Error Handling**: Error messages don't expose sensitive data
- **Network Security**: MongoDB Atlas IP whitelisting support
- **Data Isolation**: Multi-user support with strict data separation
- **Token Management**: Secure storage of Shopify, Meta, and Shiprocket tokens

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

### MongoDB Atlas Connection Issues
- Verify connection string in `.env`
- Check network access settings in Atlas dashboard
- Ensure IP address is whitelisted (or use 0.0.0.0/0 for development)
- Verify database user credentials
- Check cluster status in Atlas dashboard

### Sync Not Running
- Check MongoDB Atlas connection
- Verify user `isActive: true`
- Check logs for errors in `logs/` directory
- Ensure sync interval is configured (default: 30 minutes)

### AI Chatbot Issues
- Verify OpenAI API key is valid and has credits
- Check Pinecone API key and index name
- Ensure Pinecone index dimensions are 1536
- Review chatbot logs for specific errors

### API Errors
- Verify API credentials in user record
- Check API rate limits for Shopify/Meta/Shiprocket
- Review error logs in `logs/` directory
- Test API credentials independently

### Missing Data
- Ensure product costs are set for COGS calculations
- Check date ranges in queries
- Verify API permissions for all platforms
- Check sync job status via `/api/sync/jobs/:userId`

## 📚 Additional Documentation

- `SETUP_GUIDE.md` - Detailed setup instructions
- `AI_CHATBOT_README.md` - AI chatbot documentation
- `ATLAS_DASHBOARD_GUIDE.md` - MongoDB Atlas dashboard guide
- `API_QUICK_REFERENCE.md` - Quick API reference
- `ARCHITECTURE.md` - System architecture details
- `TESTING.md` - Testing guide

## 🌐 Cloud Infrastructure

### MongoDB Atlas
- **Cluster**: Cluster0
- **Provider**: AWS
- **Region**: us-east-1 (configurable)
- **Tier**: M0 Free (upgradable to M2/M5 for production)
- **Backup**: Automated daily backups (M2+)
- **Monitoring**: Built-in performance monitoring

### Deployment Recommendations
- Use M2 or higher tier for production workloads
- Enable automated backups
- Set up monitoring alerts
- Configure IP whitelist for security
- Use connection pooling (already configured)
- Enable retryable writes (already configured)

## 📊 Database Schema

### Users Collection
```javascript
{
  email: String,
  shopifyStore: String,
  shopifyAccessToken: String,
  metaAccessToken: String,
  metaAdAccountId: String,
  shiprocketEmail: String,
  shiprocketPassword: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### DailyMetrics Collection
```javascript
{
  userId: ObjectId,
  date: Date,
  revenue: Number,
  cogs: Number,
  grossProfit: Number,
  netProfit: Number,
  // ... 50+ calculated metrics
  createdAt: Date
}
```

### ProductCosts Collection
```javascript
{
  userId: ObjectId,
  shopifyProductId: String,
  productName: String,
  cost: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### SyncJobs Collection
```javascript
{
  userId: ObjectId,
  status: String, // 'pending', 'running', 'completed', 'failed'
  startDate: Date,
  endDate: Date,
  results: Object,
  error: String,
  createdAt: Date,
  completedAt: Date
}
```

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in `.env`
2. Use production MongoDB Atlas cluster
3. Configure proper logging levels
4. Set up monitoring and alerts
5. Enable HTTPS/SSL
6. Configure CORS for your frontend domain

### Scaling Considerations
- MongoDB Atlas auto-scales with M10+ tiers
- Consider Redis for caching (optional)
- Use PM2 or similar for process management
- Set up load balancing for multiple instances
- Monitor API rate limits

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review documentation files
3. Check MongoDB Atlas dashboard
4. Verify API credentials and quotas

## 📄 License

Private project - All rights reserved
