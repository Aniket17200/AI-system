# ⚡ Quick Start - Get Running in 5 Minutes

## Prerequisites
- ✅ Node.js installed
- ✅ MongoDB running (local or cloud)
- ✅ Shopify store with access token

## 1️⃣ Install (30 seconds)
```bash
npm install
```

## 2️⃣ Configure (30 seconds)
Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/profitfirstuser
```

## 3️⃣ Test Shopify Connection (30 seconds)
```bash
npm run test:shopify
```

**Expected:** ✅ All Shopify API tests passed!

## 4️⃣ Start Server (10 seconds)
```bash
npm run dev
```

**Expected:** 
```
[SUCCESS] Server running on port 5000
[INFO] Starting automatic sync scheduler
```

## 5️⃣ Run Complete Test (2 minutes)
Open new terminal:
```bash
npm run test:flow
```

**This will:**
- ✅ Create user with your Shopify credentials
- ✅ Fetch orders, products, customers
- ✅ Calculate all metrics
- ✅ Store in MongoDB
- ✅ Show formatted results

## 🎉 Done!

Your system is now:
- ✅ Fetching data from Shopify automatically every hour
- ✅ Calculating all Profit First metrics
- ✅ Storing data in MongoDB
- ✅ Ready to use via API

## 📊 View Your Data

**Get Summary:**
```bash
curl "http://localhost:5000/api/metrics/summary/YOUR_USER_ID?days=30"
```

**Get Daily Breakdown:**
```bash
curl "http://localhost:5000/api/metrics?userId=YOUR_USER_ID&startDate=2024-10-01&endDate=2024-10-31"
```

## 🔍 Check MongoDB

```bash
mongosh mongodb://localhost:27017/profitfirstuser

# View users
db.users.find().pretty()

# View metrics
db.dailymetrics.find().sort({date: -1}).limit(5).pretty()

# View sync jobs
db.syncjobs.find().sort({createdAt: -1}).limit(5).pretty()
```

## 📚 Next Steps

1. ✅ Add Meta Ads credentials (optional)
2. ✅ Add Shiprocket credentials (optional)
3. ✅ Build frontend dashboard
4. ✅ Deploy to production

## 📖 Full Documentation

- `README.md` - Complete API documentation
- `ARCHITECTURE.md` - System architecture
- `TESTING.md` - Testing guide
- `EXAMPLE_USAGE.md` - Usage examples
- `SETUP_GUIDE.md` - Detailed setup

## 🆘 Need Help?

Check logs:
```bash
# Windows
type logs\2025-10-20.log

# Linux/Mac
cat logs/2025-10-20.log
```

## 🎯 Your Shopify Store Data

Based on test results:
- ✅ **10 orders** found
- ✅ **10 products** found
- ✅ **10 customers** found
- ✅ Latest order: ₹1,249.00 (Order #33000)
- ✅ Store: e23104-8c.myshopify.com

**Everything is working perfectly!** 🚀
