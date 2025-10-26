# Missing Backend Routes Analysis

## Issue Summary

The frontend application is calling API endpoints that **do not exist** in the current backend implementation. This is causing the dashboard and other pages to fail when trying to load data.

## Configuration Fixed

✅ **Vite Proxy Configuration Updated**
- Changed from: `http://localhost:3000`
- Changed to: `http://localhost:6000` (matches backend PORT in .env)

## Database Configuration

✅ **MongoDB Connection**
- Using local MongoDB: `mongodb://localhost:27017/profitfirstuser`
- Database name: `profitfirstuser`
- Collections: `users`, `dailymetrics`, `productcosts`, `syncjobs`

## Missing Routes

The frontend expects these routes that **DO NOT EXIST** in the backend:

### 1. Dashboard Data Routes
```
GET /api/data/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```
**Called by**: `client/src/pages/Dashboard.jsx`
**Expected Response**:
```javascript
{
  summary: [...],           // Summary cards data
  financialsBreakdownData: {
    pieData: [...],
    list: [...],
    revenue: number
  },
  products: {
    bestSelling: [...],
    leastSelling: [...]
  },
  website: [...],
  marketing: [...],
  shipping: [...],
  performanceChartData: [...],
  charts: {
    customerTypeByDay: [...],
    marketing: [...]
  }
}
```

### 2. Marketing Data Routes
```
GET /api/data/marketingData?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```
**Called by**: `client/src/pages/Marketing.jsx`
**Expected Response**:
```javascript
{
  summary: [...],
  campaignMetrics: {...},
  spendChartData: [...],
  adsChartData: [...],
  analysisTable: [...]
}
```

### 3. Analytics Routes
```
GET /api/data/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET /api/data/analyticschart?year=YYYY&type=visitor|customer
```
**Called by**: `client/src/pages/Analytics.jsx`
**Expected Response**:
```javascript
{
  summary: {
    visitor: { total, new, returning, churn },
    customer: { total, new, returning, churn }
  },
  locations: [...],
  returningCustomers: [...],
  newCustomersTotal: number,
  charts: {
    newCustomerTrend: [...]
  },
  cohort: [...]
}
```

### 4. AI Prediction Routes
```
GET /api/data/aiprediction
```
**Called by**: `client/src/pages/Aiprediction.jsx`

### 5. ChatBot Routes
```
GET /api/data/getData
POST /api/data/newchat
POST /api/data/chatmessage
```
**Called by**: `client/src/pages/ChatBot.jsx`

### 6. Onboarding Routes
```
POST /api/onboard/step1
GET /api/onboard/proxy/token
POST /api/onboard/step2
GET /api/onboard/fetchproduct
POST /api/onboard/modifyprice
GET /api/onboard/ad-accounts
POST /api/onboard/step4
GET /api/onboard/login
POST /api/onboard/step5
```
**Called by**: `client/src/components/Step*.jsx`

### 7. Authentication Routes
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/google-signup
GET /api/auth/verify-email/:token
GET /api/auth/users/:id
```
**Called by**: `client/src/pages/Signup.jsx`, `Login.jsx`, `VerifyEmail.jsx`

### 8. Admin Routes
```
GET /api/admin/users
GET /api/admin/contacts
```
**Called by**: `client/src/pages/Adminpage.jsx`

### 9. Contact Routes
```
POST /api/getInTouch
```
**Called by**: `client/src/pages/Contactus.jsx`

## Existing Backend Routes

The current backend (`routes/index.js`) only has:

✅ **User Routes**
- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`

✅ **Product Cost Routes**
- `POST /api/product-costs`
- `GET /api/product-costs/:userId`
- `DELETE /api/product-costs/:id`

✅ **Sync Routes**
- `POST /api/sync/manual`
- `GET /api/sync/jobs/:userId`
- `GET /api/sync/status/:jobId`

✅ **Metrics Routes**
- `GET /api/metrics?userId=X&startDate=X&endDate=X`
- `GET /api/metrics/summary/:userId?days=30`

✅ **AI Chat Routes** (`routes/chatRoutes.js`)
- `POST /api/ai/chat`
- `POST /api/ai/index/:userId`
- `GET /api/ai/suggestions/:userId`

## Solution Options

### Option 1: Create Missing Routes (Recommended)

You need to create new route files to handle the missing endpoints:

1. **Create `routes/dataRoutes.js`** - Handle all `/data/*` endpoints
2. **Create `routes/onboardRoutes.js`** - Handle onboarding flow
3. **Create `routes/authRoutes.js`** - Handle authentication
4. **Create `routes/adminRoutes.js`** - Handle admin operations

These routes should:
- Query the `dailymetrics` collection from MongoDB
- Aggregate and transform data for frontend consumption
- Calculate derived metrics (ROAS, profit margins, etc.)
- Format responses to match frontend expectations

### Option 2: Use Existing Metrics Routes

Modify the frontend to use the existing `/api/metrics` endpoints instead of `/api/data/*`:

**Current**: `GET /api/data/dashboard?startDate=X&endDate=X`
**Change to**: `GET /api/metrics?userId=X&startDate=X&endDate=X`

Then transform the response in the frontend to match the expected format.

### Option 3: Check for Separate Backend

There might be a separate backend server (possibly in another repository or branch) that handles these routes. Check if:
- There's another Node.js server running
- There's a different backend codebase
- These routes were in a previous version

## Data Flow

```
Frontend (React) 
  ↓ (calls /api/data/dashboard)
Vite Proxy (localhost:5173)
  ↓ (proxies to localhost:6000)
Backend Server (Express on port 6000)
  ↓ (queries MongoDB)
MongoDB Local (localhost:27017/profitfirstuser)
  ↓ (returns data)
Backend
  ↓ (transforms & calculates)
Frontend (displays)
```

## MongoDB Data Structure

Your local MongoDB should have:

**Collections**:
1. `users` - User accounts with API credentials
2. `dailymetrics` - Daily aggregated metrics per user
3. `productcosts` - Product cost data for COGS
4. `syncjobs` - Sync job history

**Sample DailyMetrics Document**:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: ISODate("2024-01-15"),
  totalOrders: 50,
  revenue: 125000,
  cogs: 45000,
  adSpend: 15000,
  shippingCost: 8000,
  grossProfit: 80000,
  netProfit: 57000,
  grossProfitMargin: 64,
  netProfitMargin: 45.6,
  roas: 8.33,
  // ... 50+ more fields
}
```

## Next Steps

1. **Check MongoDB Data**
   ```bash
   mongosh
   use profitfirstuser
   db.users.find()
   db.dailymetrics.find().limit(5)
   ```

2. **Verify Backend is Running**
   ```bash
   npm start
   # Should see: "Server running on port 6000"
   # Should see: "MongoDB Connected: localhost"
   ```

3. **Test Existing Endpoints**
   ```bash
   # Get users
   curl http://localhost:6000/api/users
   
   # Get metrics (replace USER_ID)
   curl "http://localhost:6000/api/metrics?userId=USER_ID&startDate=2024-01-01&endDate=2024-01-31"
   ```

4. **Create Missing Routes**
   - Implement the `/data/*` endpoints
   - Use the existing `DailyMetrics` model
   - Aggregate data from MongoDB
   - Format responses for frontend

## Temporary Workaround

To see if the backend is working, you can:

1. Start the backend: `npm start`
2. Check if MongoDB is running: `mongosh`
3. Verify data exists: `db.dailymetrics.countDocuments()`
4. Test existing endpoints with Postman or curl

The frontend will show loading spinners until the missing routes are implemented.

## Contact

If you have questions about:
- Where the original `/data/*` routes are
- How to implement them
- Database schema details

Please provide more context about the project history.
