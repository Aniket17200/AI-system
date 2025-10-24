# 🏗️ System Architecture

## Overview

Production-ready Node.js backend with automatic data synchronization from multiple e-commerce APIs.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client/Frontend                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express Server                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware Layer                                     │   │
│  │  - CORS                                               │   │
│  │  - Body Parser                                        │   │
│  │  - Request Logging                                    │   │
│  │  - Input Validation                                   │   │
│  │  - Error Handler                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes Layer                                         │   │
│  │  - /api/users                                         │   │
│  │  - /api/product-costs                                 │   │
│  │  - /api/sync                                          │   │
│  │  - /api/metrics                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Sync Scheduler (Cron)                                │   │
│  │  - Runs every hour                                    │   │
│  │  - Manages sync jobs                                  │   │
│  │  - Tracks job status                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Sync Service                                    │   │
│  │  - Orchestrates data fetching                         │   │
│  │  - Handles retry logic                                │   │
│  │  - Processes calculations                             │   │
│  │  - Saves to database                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Shopify    │  │  Meta Ads   │  │ Shiprocket  │
│  Service    │  │  Service    │  │  Service    │
│             │  │             │  │             │
│ - Orders    │  │ - Insights  │  │ - Shipments │
│ - Products  │  │ - Spend     │  │ - Costs     │
│ - Customers │  │ - ROAS      │  │ - Status    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Shopify    │  │  Meta Ads   │  │ Shiprocket  │
│    API      │  │    API      │  │    API      │
└─────────────┘  └─────────────┘  └─────────────┘

         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Calculation Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Profit Calculations Utility                          │   │
│  │  - Revenue calculations                               │   │
│  │  - COGS calculations                                  │   │
│  │  - Profit margins                                     │   │
│  │  - Marketing metrics (ROAS, POAS, AOV, etc.)         │   │
│  │  - Customer analytics                                 │   │
│  │  - Shipping analytics                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (MongoDB)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Collections:                                         │   │
│  │  - users (API credentials)                            │   │
│  │  - productcosts (COGS mapping)                        │   │
│  │  - dailymetrics (calculated metrics)                  │   │
│  │  - syncjobs (job tracking)                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Logger    │  │  Error      │  │  Validator  │
│             │  │  Handler    │  │             │
│ - Daily logs│  │ - Catch all │  │ - Input     │
│ - JSON fmt  │  │ - Log errors│  │ - Dates     │
│ - Console   │  │ - Safe resp │  │ - Required  │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Data Flow

### 1. Automatic Sync Flow
```
Cron Scheduler (Every Hour)
    ↓
Get All Active Users
    ↓
For Each User:
    ↓
Create Sync Job (status: running)
    ↓
Fetch Shopify Orders (with retry)
    ↓
Fetch Meta Ads Data (with retry)
    ↓
Fetch Shiprocket Data (with retry)
    ↓
Get Product Costs from DB
    ↓
Auto-sync Missing Product Costs
    ↓
Group Data by Date
    ↓
For Each Date:
    ↓
Calculate All Metrics
    ↓
Save to DailyMetrics Collection
    ↓
Update Sync Job (status: completed)
    ↓
Log Success/Errors
```

### 2. Manual Sync Flow
```
API Request: POST /api/sync/manual
    ↓
Validate Input (userId, dates)
    ↓
Get User from DB
    ↓
[Same as Automatic Sync from "Create Sync Job"]
    ↓
Return Result to Client
```

### 3. Metrics Retrieval Flow
```
API Request: GET /api/metrics
    ↓
Validate Input (userId, date range)
    ↓
Query DailyMetrics Collection
    ↓
Calculate Totals
    ↓
Return Data to Client
```

## Key Components

### 1. Sync Scheduler
- **Purpose**: Automate data synchronization
- **Frequency**: Every hour (configurable)
- **Features**:
  - Runs on server startup
  - Processes all active users
  - Tracks job status
  - Error recovery

### 2. Data Sync Service
- **Purpose**: Orchestrate data fetching and processing
- **Features**:
  - Retry logic (3 attempts with exponential backoff)
  - Graceful degradation (continues if one API fails)
  - Auto product cost estimation
  - Date-based grouping
  - Comprehensive error tracking

### 3. API Services
- **Shopify Service**: Fetch orders, products, customers
- **Meta Ads Service**: Fetch ad insights, spend, ROAS
- **Shiprocket Service**: Fetch shipments, costs, status

### 4. Calculation Utility
- **Purpose**: Calculate all Profit First metrics
- **Features**:
  - Revenue & COGS calculations
  - Profit margins
  - Marketing metrics (ROAS, POAS, AOV, CPP, CPC, CTR, CPM)
  - Customer analytics
  - Shipping analytics

### 5. Middleware
- **Error Handler**: Catch and log all errors
- **Validator**: Validate input data
- **Logger**: Log all requests and operations

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  shopifyStore: String,
  shopifyAccessToken: String (encrypted),
  metaAccessToken: String (encrypted),
  metaAdAccountId: String,
  shiprocketEmail: String,
  shiprocketPassword: String (encrypted),
  isActive: Boolean,
  lastSyncAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### ProductCosts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  shopifyProductId: String,
  productName: String,
  cost: Number,
  updatedAt: Date
}
```

### DailyMetrics Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date,
  
  // Orders & Revenue
  totalOrders: Number,
  revenue: Number,
  
  // Costs
  cogs: Number,
  adSpend: Number,
  shippingCost: Number,
  
  // Profit
  grossProfit: Number,
  grossProfitMargin: Number,
  netProfit: Number,
  netProfitMargin: Number,
  
  // Marketing
  roas: Number,
  poas: Number,
  aov: Number,
  cpp: Number,
  cpc: Number,
  ctr: Number,
  cpm: Number,
  reach: Number,
  impressions: Number,
  linkClicks: Number,
  
  // Customers
  newCustomers: Number,
  returningCustomers: Number,
  totalCustomers: Number,
  returningRate: Number,
  
  // Shipping
  totalShipments: Number,
  delivered: Number,
  inTransit: Number,
  rto: Number,
  ndr: Number,
  deliveryRate: Number,
  rtoRate: Number,
  
  createdAt: Date
}
```

### SyncJobs Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  jobId: String (unique),
  status: String (running|completed|failed),
  startedAt: Date,
  completedAt: Date,
  recordsSynced: Number,
  errors: [String],
  createdAt: Date
}
```

## Error Handling Strategy

### 1. API Level
- Try-catch blocks around all async operations
- Specific error messages for different failure types
- HTTP status codes (400, 404, 500)

### 2. Service Level
- Retry logic with exponential backoff
- Graceful degradation (continue if one API fails)
- Error collection and reporting

### 3. Global Level
- Express error handler middleware
- Comprehensive error logging
- Safe error responses (no sensitive data)

## Logging Strategy

### Log Levels
- **INFO**: Normal operations (requests, sync start/end)
- **SUCCESS**: Successful operations
- **WARN**: Non-critical issues (API failures with fallback)
- **ERROR**: Critical failures

### Log Format
```json
{
  "timestamp": "2024-10-20T10:30:00.000Z",
  "level": "info",
  "message": "Starting sync for user",
  "userId": "671234567890abcdef123456",
  "email": "user@example.com"
}
```

### Log Storage
- Daily log files in `logs/` directory
- JSON format for easy parsing
- Console output with color coding

## Security Considerations

1. **Credential Storage**: API tokens stored in database (should be encrypted in production)
2. **API Responses**: Sensitive fields excluded from responses
3. **Input Validation**: All inputs validated before processing
4. **Error Messages**: No sensitive data in error responses
5. **Environment Variables**: Configuration via .env file

## Scalability Considerations

1. **Horizontal Scaling**: Stateless design allows multiple instances
2. **Database Indexing**: Indexes on userId and date fields
3. **Caching**: Can add Redis for frequently accessed data
4. **Rate Limiting**: Can add rate limiting middleware
5. **Queue System**: Can add Bull/BullMQ for job processing

## Performance Optimizations

1. **Batch Processing**: Process multiple dates in single sync
2. **Parallel API Calls**: Fetch from multiple APIs concurrently
3. **Database Upserts**: Efficient updates with upsert operations
4. **Retry Logic**: Exponential backoff prevents API hammering
5. **Selective Syncing**: Only sync active users

## Monitoring & Observability

1. **Sync Jobs**: Track all sync operations
2. **Logs**: Comprehensive logging of all operations
3. **Error Tracking**: Collect and store errors
4. **Metrics**: Calculate and store all business metrics
5. **Health Check**: Root endpoint for system status

## Future Enhancements

1. **Webhook Support**: Real-time updates from Shopify
2. **Email Notifications**: Alert on sync failures
3. **Dashboard**: Web UI for monitoring
4. **Multi-tenant**: Support multiple organizations
5. **Data Export**: CSV/Excel export functionality
6. **Advanced Analytics**: Trends, forecasting, anomaly detection
