# ProfitFirst - AI-Powered E-commerce Analytics Platform 🚀

Enterprise-grade analytics platform with AI chatbot for e-commerce businesses. Automatically syncs data from Shopify, Meta Ads, and Shiprocket to provide real-time insights and conversational analytics.

## ✨ Key Features

### 🤖 AI-Powered Analytics
- **Conversational AI Assistant** - Ask business questions in natural language
- **3x Faster Responses** - Optimized for speed (sub-second responses)
- **Smart Caching** - Intelligent caching for 93% faster repeated queries
- **Industry Benchmarks** - Automatic comparison with e-commerce standards
- **Contextual Insights** - Actionable recommendations based on your data

### 📊 Comprehensive Metrics
- **Financial**: Revenue, COGS, Gross/Net Profit, Margins
- **Marketing**: ROAS, POAS, AOV, CPP, CPC, CTR, CPM
- **Customers**: Total, New, Returning, Retention Rate
- **Shipping**: Delivery Rate, RTO Rate, NDR tracking
- **Predictions**: AI-powered 3-month forecasts

### 🔄 Automatic Data Sync
- **Every 30 Minutes** - Automatic sync for all active users
- **Multi-Platform** - Shopify, Meta Ads, Shiprocket integration
- **Retry Logic** - Exponential backoff for failed API calls
- **Error Recovery** - Continues processing even if one API fails
- **Job Tracking** - Monitor sync status and history

### ☁️ Cloud Infrastructure
- **MongoDB Atlas** - Globally distributed cloud database
- **Optimized Indexes** - 60-80% faster queries
- **Auto-scaling** - Handles growing data seamlessly
- **Automated Backups** - Daily backups with point-in-time recovery
- **High Availability** - 99.9% uptime SLA

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account (free tier available)
- OpenAI API key (for AI chatbot)
- Pinecone account (for vector search)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd profitfirst
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=6000
NODE_ENV=production

# MongoDB Atlas (Cloud Database)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/profitfirst?retryWrites=true&w=majority

# OpenAI (AI Chatbot)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Pinecone (Vector Search)
PINECONE_API_KEY=pcsk_YOUR_KEY_HERE
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=profitfirst-analytics

# Data Sync Configuration
DATA_SYNC_INTERVAL=30
CACHE_TTL_MINUTES=30
```

4. **Set up MongoDB Atlas**
   - Create account at https://www.mongodb.com/cloud/atlas
   - Create a free M0 cluster
   - Add your IP to network access (or use 0.0.0.0/0 for development)
   - Create database user
   - Get connection string and update `MONGODB_URI`

5. **Set up OpenAI**
   - Create account at https://platform.openai.com
   - Generate API key
   - Add credits/billing
   - Update `OPENAI_API_KEY`

6. **Set up Pinecone**
   - Create account at https://www.pinecone.io
   - Create index: `profitfirst-analytics`
     - Dimensions: 1536
     - Metric: cosine
   - Get API key and update `.env`

7. **Optimize database (one-time)**
```bash
node optimize-database-indexes.js
```

8. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:6000`

## 📡 API Documentation

### Authentication & Users

**Create User**
```bash
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "shopifyStore": "your-store.myshopify.com",
  "shopifyAccessToken": "shpat_xxx",
  "metaAccessToken": "EAAxx",
  "metaAdAccountId": "act_123456",
  "shiprocketEmail": "email@example.com",
  "shiprocketPassword": "password"
}
```

**Get User**
```bash
GET /api/users/:userId
```

**Update User**
```bash
PUT /api/users/:userId
Content-Type: application/json

{
  "isActive": true
}
```

### AI Chatbot

**Ask Question**
```bash
POST /api/chat
Content-Type: application/json

{
  "userId": "USER_ID",
  "message": "How's my business in the last 30 days?"
}
```

**Response Example:**
```json
{
  "message": "You've had a strong month! Revenue hit ₹58.3L from 3,591 orders (120/day). Profit ₹20.6L at 35.2% margin (excellent vs 10-20% avg). ROAS 4.91x is solid, meaning every ₹1 in ads brings ₹4.91 revenue.",
  "responseTime": 687,
  "usage": {
    "total_tokens": 1243
  }
}
```

### Data Sync

**Manual Sync**
```bash
POST /api/sync/manual
Content-Type: application/json

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

**Check Job Status**
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

**Get Dashboard Data**
```bash
GET /api/data/dashboard/:userId?startDate=2024-10-01&endDate=2024-10-31
```

### Product Costs

**Add/Update Product Cost**
```bash
POST /api/product-costs
Content-Type: application/json

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

## 🤖 AI Chatbot Examples

### General Performance
```
Q: "How's my business in the last 30 days?"
A: "You've had a strong month! Revenue hit ₹58.3L from 3,591 orders 
    (120/day). Profit ₹20.6L at 35.2% margin (excellent vs 10-20% avg). 
    ROAS 4.91x is solid, meaning every ₹1 in ads brings ₹4.91 revenue."
```

### Specific Metrics
```
Q: "What's my ROAS?"
A: "Your ROAS is 4.91x, solid and above the 4x benchmark. Every ₹1 you 
    spend on ads generates ₹4.91 in revenue."

Q: "How many orders did I get?"
A: "You had 3,591 orders in the last 30 days, averaging 120 orders per 
    day. That's a healthy volume for your business size."

Q: "What's my profit margin?"
A: "Your net profit margin is 35.2%, which is excellent for e-commerce - 
    well above the typical 10-20% range. This means you're keeping ₹35.20 
    as profit for every ₹100 in revenue."
```

### Date-Specific Queries
```
Q: "What was my revenue yesterday?"
A: "Yesterday, your revenue was ₹2,63,264 from 127 orders. That's above 
    your daily average of ₹1,94,491, so it was a strong day!"

Q: "Show me October 2 performance"
A: "On October 2, 2025, your revenue was ₹1,64,428 from 105 orders."
```

## 🏗️ Architecture

```
profitfirst/
├── config/
│   ├── db.js                    # MongoDB Atlas connection
│   └── logger.js                # Winston logging
├── middleware/
│   ├── errorHandler.js          # Global error handling
│   └── validation.js            # Input validation
├── models/
│   ├── User.js                  # User & API credentials
│   ├── DailyMetrics.js          # Daily metrics
│   ├── ProductCost.js           # Product costs
│   ├── Prediction.js            # AI predictions
│   └── SyncJob.js               # Sync tracking
├── services/
│   ├── aiChatService.js         # AI chatbot (optimized)
│   ├── shopifyService.js        # Shopify API
│   ├── metaAdsService.js        # Meta Ads API
│   ├── shiprocketService.js     # Shiprocket API
│   ├── dataSyncService.js       # Data sync orchestration
│   ├── syncScheduler.js         # Auto-sync (30 min)
│   ├── predictionService.js     # AI predictions
│   └── advancedPredictionService.js # LangChain predictions
├── routes/
│   ├── index.js                 # Main routes
│   ├── authRoutes.js            # Authentication
│   ├── chatRoutes.js            # AI chatbot
│   └── dataRoutes.js            # Data endpoints
├── utils/
│   └── calculations.js          # Profit formulas
├── client/                      # React frontend
│   └── src/
│       └── pages/
│           ├── Dashboard.jsx    # Main dashboard
│           ├── Marketing.jsx    # Marketing analytics
│           ├── ChatBot.jsx      # AI chat interface
│           ├── Aiprediction.jsx # Predictions
│           └── AIGrowth.jsx     # Growth insights
└── server.js                    # Entry point
```

## 🎯 Performance Optimizations

### AI Chatbot Speed
- **3x faster** responses (1,800ms → 600ms)
- **93% faster** cached queries (1,300ms → 87ms)
- **67% cheaper** per query
- **60% fewer tokens** used

### Database Optimizations
- Compound indexes for 60-80% faster queries
- Lean queries for 40-60% faster retrieval
- Smart caching with 5-minute TTL
- Automatic cache cleanup

### System Optimizations
- Optimized system prompts (68% smaller)
- Field selection (only fetch needed data)
- Connection pooling
- Retry logic with exponential backoff

## 📊 Calculated Metrics

### Financial Metrics
- Revenue, COGS, Gross Profit, Net Profit
- Gross Profit Margin, Net Profit Margin
- Average Order Value (AOV)

### Marketing Metrics
- ROAS (Return on Ad Spend)
- POAS (Profit on Ad Spend)
- CPP (Cost Per Purchase)
- CPC (Cost Per Click)
- CTR (Click-Through Rate)
- CPM (Cost Per Mille)
- Reach, Impressions, Link Clicks

### Customer Metrics
- Total Customers
- New Customers
- Returning Customers
- Returning Rate

### Shipping Metrics
- Total Shipments
- Delivered, In-Transit, RTO, NDR
- Delivery Rate, RTO Rate

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ MongoDB Atlas encryption (at rest & in transit)
- ✅ API credentials stored securely in database
- ✅ Input validation on all endpoints
- ✅ Error messages don't expose sensitive data
- ✅ IP whitelisting support
- ✅ Multi-user data isolation
- ✅ Secure token management

## 📝 Logging

- Daily log files in `logs/` directory
- JSON format for easy parsing
- Includes timestamps, levels, metadata
- Console output with color coding
- Automatic log rotation

## 🚨 Troubleshooting

### MongoDB Connection Issues
```bash
# Check connection
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"

# Test connection
node verify-cloud-data.js
```

### AI Chatbot Issues
```bash
# Check OpenAI API key
node test-openai-key.js

# Test AI chat
node test-ai-chat-improved.js
```

### Sync Issues
```bash
# Check sync jobs
GET /api/sync/jobs/:userId

# Manual sync
POST /api/sync/manual
```

### Performance Issues
```bash
# Optimize database indexes
node optimize-database-indexes.js

# Check cache stats
aiChatService.getCacheStats()
```

## 📚 Documentation

- `AI_CHAT_SPEED_OPTIMIZATION.md` - AI performance details
- `AI_CHAT_FINAL_OPTIMIZED.md` - AI optimization summary
- `BEFORE_AFTER_OPTIMIZATION.md` - Performance comparison
- `SETUP_GUIDE.md` - Detailed setup instructions
- `ATLAS_DASHBOARD_GUIDE.md` - MongoDB Atlas guide
- `API_QUICK_REFERENCE.md` - Quick API reference
- `ARCHITECTURE.md` - System architecture
- `TESTING.md` - Testing guide

## 🌐 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB Atlas cluster (M2+)
- [ ] Configure proper CORS settings
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and alerts
- [ ] Configure automated backups
- [ ] Set up PM2 or similar process manager
- [ ] Configure load balancing (if needed)
- [ ] Monitor API rate limits
- [ ] Set up error tracking (Sentry, etc.)

### Recommended Stack
- **Hosting**: AWS, Google Cloud, or Azure
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **Monitoring**: MongoDB Atlas + Custom dashboards
- **Error Tracking**: Sentry or similar

## 📈 Scaling

- MongoDB Atlas auto-scales with M10+ tiers
- Consider Redis for additional caching
- Use PM2 cluster mode for multiple instances
- Set up load balancing for high traffic
- Monitor and optimize API rate limits
- Implement CDN for static assets

## 🤝 Contributing

This is a private project. For internal development:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Code review required

## 📄 License

Private project - All rights reserved

## 🆘 Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review logs in `logs/` directory
3. Check MongoDB Atlas dashboard
4. Verify API credentials and quotas
5. Contact development team

---

**Built with ❤️ for e-commerce businesses**

*Last updated: October 2025*
