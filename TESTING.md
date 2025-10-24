# 🧪 Testing Guide

## Quick Start Testing

### 1. Test Shopify API Connection (Direct)
This tests your Shopify credentials directly without the backend:

```bash
npm run test:shopify
```

**What it does:**
- ✅ Connects to Shopify API
- ✅ Fetches orders, products, customers
- ✅ Shows sample data
- ✅ Verifies API format

**Expected Output:**
```
🛍️  Testing Shopify API Connection
✅ Found 10 orders
✅ Found 15 products
✅ Found 8 customers
🎉 All Shopify API tests passed!
```

### 2. Test Complete Flow (Backend + Database)
This tests the entire system end-to-end:

```bash
npm run test:flow
```

**What it does:**
- ✅ Creates user in MongoDB
- ✅ Tests Shopify API connection
- ✅ Adds product costs
- ✅ Syncs data (last 30 days)
- ✅ Calculates all metrics
- ✅ Shows formatted results

**Expected Output:**
```
🚀 Starting Complete Flow Test
✅ User created successfully!
✅ Shopify API connected successfully!
✅ Sync completed!
📊 Metrics Summary (Last 30 Days):
   💰 Revenue: ₹ 45000.00
   💎 Net Profit: ₹ 12450.00 (27.67%)
   📈 ROAS: 12.86x
🎉 Complete Flow Test Finished Successfully!
```

## Manual Testing with cURL

### Step 1: Start the Server
```bash
npm run dev
```

### Step 2: Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"shopifyStore\":\"e23104-8c.myshopify.com\",\"shopifyAccessToken\":\"YOUR_SHOPIFY_ACCESS_TOKEN\",\"isActive\":true}"
```

**Save the returned `_id`!**

### Step 3: Sync Data
```bash
curl -X POST http://localhost:5000/api/sync/manual \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"YOUR_USER_ID\",\"startDate\":\"2024-10-01\",\"endDate\":\"2024-10-31\"}"
```

### Step 4: Get Metrics
```bash
curl "http://localhost:5000/api/metrics/summary/YOUR_USER_ID?days=30"
```

## Testing with MongoDB

### View Stored Data

**Connect to MongoDB:**
```bash
mongosh mongodb://localhost:27017/profitfirstuser
```

**Check Users:**
```javascript
db.users.find().pretty()
```

**Check Daily Metrics:**
```javascript
db.dailymetrics.find().sort({date: -1}).limit(5).pretty()
```

**Check Product Costs:**
```javascript
db.productcosts.find().pretty()
```

**Check Sync Jobs:**
```javascript
db.syncjobs.find().sort({createdAt: -1}).limit(5).pretty()
```

**Count Records:**
```javascript
db.users.countDocuments()
db.dailymetrics.countDocuments()
db.productcosts.countDocuments()
db.syncjobs.countDocuments()
```

## Verify Data Format

### Expected User Document
```json
{
  "_id": "671abc123def456789012345",
  "email": "test@example.com",
  "shopifyStore": "e23104-8c.myshopify.com",
  "shopifyAccessToken": "shpat_xxx",
  "isActive": true,
  "createdAt": "2024-10-20T10:00:00.000Z",
  "updatedAt": "2024-10-20T10:00:00.000Z"
}
```

### Expected DailyMetrics Document
```json
{
  "_id": "671def456abc789012345678",
  "userId": "671abc123def456789012345",
  "date": "2024-10-20T00:00:00.000Z",
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
  "rtoRate": 0,
  "createdAt": "2024-10-20T10:05:00.000Z"
}
```

### Expected ProductCost Document
```json
{
  "_id": "671ghi789jkl012345678901",
  "userId": "671abc123def456789012345",
  "shopifyProductId": "123456789",
  "productName": "Sample Product",
  "cost": 150,
  "updatedAt": "2024-10-20T10:02:00.000Z"
}
```

### Expected SyncJob Document
```json
{
  "_id": "671jkl012mno345678901234",
  "userId": "671abc123def456789012345",
  "jobId": "sync_671abc123def456789012345_1729425600000",
  "status": "completed",
  "startedAt": "2024-10-20T10:00:00.000Z",
  "completedAt": "2024-10-20T10:02:15.000Z",
  "recordsSynced": 31,
  "errors": [],
  "createdAt": "2024-10-20T10:00:00.000Z"
}
```

## Troubleshooting Tests

### Test Fails: "Cannot connect to MongoDB"
**Solution:**
```bash
# Start MongoDB
mongod

# Or check if it's running
mongosh
```

### Test Fails: "Shopify API Error"
**Check:**
1. Is the access token correct?
2. Is the store URL correct?
3. Does the token have required permissions?

**Test directly:**
```bash
curl -X GET "https://e23104-8c.myshopify.com/admin/api/2024-01/orders.json?limit=1" \
  -H "X-Shopify-Access-Token: YOUR_SHOPIFY_ACCESS_TOKEN"
```

### Test Fails: "User not found"
**Solution:**
```bash
# Check if user was created
mongosh mongodb://localhost:27017/profitfirstuser
db.users.find()
```

### No Data Synced
**Check:**
1. Does your Shopify store have orders?
2. Are the dates correct?
3. Check logs: `cat logs/2024-10-20.log`

### Automatic Sync Not Running
**Check:**
1. Is the server running?
2. Is user `isActive: true`?
3. Check logs for errors

## Performance Testing

### Test Sync Speed
```bash
time npm run test:flow
```

### Test API Response Time
```bash
time curl "http://localhost:5000/api/metrics/summary/USER_ID?days=30"
```

### Test Database Query Speed
```javascript
// In mongosh
db.dailymetrics.find({userId: ObjectId("USER_ID")}).explain("executionStats")
```

## Load Testing (Optional)

### Install Apache Bench
```bash
# Windows: Download from Apache website
# Linux: sudo apt-get install apache2-utils
# Mac: brew install ab
```

### Test API Endpoint
```bash
ab -n 100 -c 10 http://localhost:5000/api/metrics/summary/USER_ID?days=30
```

## Validation Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] User creation works
- [ ] Shopify API connection works
- [ ] Data sync completes
- [ ] Metrics calculated correctly
- [ ] Daily metrics stored in DB
- [ ] Product costs stored in DB
- [ ] Sync jobs tracked
- [ ] Automatic sync runs hourly
- [ ] Logs created properly
- [ ] Error handling works
- [ ] API responses formatted correctly

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Check MongoDB has data
3. ✅ Review logs for errors
4. ✅ Test with real Shopify data
5. ✅ Add Meta Ads credentials (optional)
6. ✅ Add Shiprocket credentials (optional)
7. ✅ Let automatic sync run
8. ✅ Monitor for 24 hours
9. ✅ Build frontend dashboard
10. ✅ Deploy to production

## Support

If tests fail, check:
1. `logs/` folder for detailed errors
2. MongoDB connection
3. Shopify API credentials
4. Network connectivity
5. Port 5000 availability
