# 📢 How to Add Meta Ads Data

## Current Status

✅ **Tanesh User Created**
- User ID: `68c812b0afc4892c1f8128e3`
- Email: taneshpurohit09@gmail.com
- Shopify: ✅ Connected (250 orders synced)
- Meta Ads: ❌ Not connected (showing ₹0)
- Shiprocket: ❌ Not connected

## Why Meta Ads Shows ₹0

Meta Ads data is not stored because **Meta Ads credentials haven't been added yet**. The system is ready to fetch Meta Ads data, but needs:
1. Meta Access Token
2. Meta Ad Account ID

## How to Get Meta Ads Credentials

### Step 1: Get Meta Access Token

1. Go to **Facebook Graph API Explorer**:
   https://developers.facebook.com/tools/explorer/

2. Select your **App** (or create one)

3. Click **"Get Token"** → **"Get User Access Token"**

4. Select these permissions:
   - `ads_read`
   - `ads_management`
   - `business_management`

5. Click **"Generate Access Token"**

6. Copy the token (starts with `EAA...`)

### Step 2: Get Ad Account ID

1. Go to **Facebook Ads Manager**:
   https://business.facebook.com/adsmanager/

2. Look at the URL, you'll see something like:
   ```
   act_123456789
   ```

3. Copy the Ad Account ID (including `act_`)

## Add Meta Ads Credentials

### Option 1: Using cURL (Recommended)

```bash
curl -X PUT http://localhost:5000/api/users/68c812b0afc4892c1f8128e3 \
  -H "Content-Type: application/json" \
  -d '{
    "metaAccessToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxx",
    "metaAdAccountId": "act_123456789"
  }'
```

### Option 2: Using API Test File

Add to `test-api.http`:

```http
### Add Meta Ads Credentials for Tanesh
PUT http://localhost:5000/api/users/68c812b0afc4892c1f8128e3
Content-Type: application/json

{
  "metaAccessToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxx",
  "metaAdAccountId": "act_123456789"
}
```

### Option 3: Using JavaScript

```javascript
const axios = require('axios');

axios.put('http://localhost:5000/api/users/68c812b0afc4892c1f8128e3', {
  metaAccessToken: 'EAAxxxxxxxxxxxxxxxxxxxxxxxxx',
  metaAdAccountId: 'act_123456789'
})
.then(response => {
  console.log('✅ Meta Ads credentials added!');
  console.log(response.data);
})
.catch(error => {
  console.error('❌ Error:', error.response?.data || error.message);
});
```

## After Adding Credentials

### 1. Trigger Manual Sync

```bash
npm run sync:tanesh
```

Or via API:

```bash
curl -X POST http://localhost:5000/api/sync/manual \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "68c812b0afc4892c1f8128e3",
    "startDate": "2025-07-20",
    "endDate": "2025-10-20"
  }'
```

### 2. Verify Meta Ads Data

```bash
npm run verify:db
```

You should now see:
- ✅ Ad Spend (actual amount)
- ✅ Reach (number of people)
- ✅ Impressions (ad views)
- ✅ Clicks (link clicks)
- ✅ ROAS (calculated)
- ✅ CPC, CTR, CPM (calculated)

### 3. Check Metrics

```bash
curl "http://localhost:5000/api/metrics/summary/68c812b0afc4892c1f8128e3?days=90"
```

## What Meta Ads Data Will Be Stored

Once credentials are added, the system will automatically fetch and store:

### Daily Meta Ads Metrics:
- **Ad Spend** - Total amount spent on ads
- **Reach** - Unique users who saw ads
- **Impressions** - Total times ads were shown
- **Link Clicks** - Number of clicks on ads
- **CPC** - Cost Per Click (calculated)
- **CTR** - Click-Through Rate (calculated)
- **CPM** - Cost Per Mille/1000 impressions (calculated)
- **ROAS** - Return on Ad Spend (calculated)
- **POAS** - Profit on Ad Spend (calculated)

### Example Data After Meta Ads Connection:

```
Date: 2025-10-20

📦 SHOPIFY DATA:
   Orders: 97
   Revenue: ₹157,426.30

📢 META ADS DATA:
   Ad Spend: ₹3,500.00        ← Will show actual amount
   Reach: 25,000              ← Will show actual reach
   Impressions: 50,000        ← Will show actual impressions
   Clicks: 1,200              ← Will show actual clicks
   ROAS: 44.98x               ← Calculated (Revenue/Ad Spend)
   CPC: ₹2.92                 ← Calculated (Spend/Clicks)
   CTR: 2.4%                  ← Calculated (Clicks/Impressions)
   CPM: ₹70.00                ← Calculated (Spend/Impressions*1000)

💰 NET PROFIT:
   Net Profit: ₹89,945.10     ← Now includes ad spend deduction
   Net Margin: 57.13%         ← Adjusted for ad costs
   POAS: 25.70x               ← Profit/Ad Spend
```

## Troubleshooting

### Error: "Invalid Access Token"
- Token might be expired (they expire after 60 days)
- Generate a new token from Graph API Explorer
- Consider using a long-lived token

### Error: "Invalid Ad Account ID"
- Make sure to include `act_` prefix
- Verify you have access to the ad account
- Check permissions in Business Manager

### No Data Showing
- Verify date range has ad campaigns running
- Check if ad account has spend in that period
- Review logs: `cat logs/2025-10-20.log`

## Test Meta Ads API Directly

Before adding to system, test if credentials work:

```bash
curl -X GET "https://graph.facebook.com/v18.0/act_YOUR_ACCOUNT_ID/insights?access_token=YOUR_TOKEN&fields=spend,reach,impressions,clicks&time_range={'since':'2025-10-01','until':'2025-10-20'}"
```

If this returns data, your credentials are correct!

## Automatic Sync

Once Meta Ads credentials are added:
- ✅ System will automatically fetch Meta Ads data every hour
- ✅ Data will be stored date-wise in MongoDB
- ✅ All marketing metrics will be calculated
- ✅ ROAS and POAS will be accurate

## Summary

**Current State:**
```
Tanesh User: 68c812b0afc4892c1f8128e3
├── Shopify: ✅ Connected (250 orders, ₹4.23L revenue)
├── Meta Ads: ❌ Not connected (add credentials)
└── Shiprocket: ❌ Not connected (optional)
```

**After Adding Meta Ads:**
```
Tanesh User: 68c812b0afc4892c1f8128e3
├── Shopify: ✅ Connected (250 orders, ₹4.23L revenue)
├── Meta Ads: ✅ Connected (ad spend, ROAS, etc.)
└── Shiprocket: ❌ Not connected (optional)
```

---

**Once you have Meta Ads credentials, run:**
```bash
# 1. Add credentials (use actual values)
curl -X PUT http://localhost:5000/api/users/68c812b0afc4892c1f8128e3 \
  -H "Content-Type: application/json" \
  -d '{"metaAccessToken":"YOUR_TOKEN","metaAdAccountId":"act_YOUR_ID"}'

# 2. Sync data
npm run sync:tanesh

# 3. Verify
npm run verify:db
```

Then Meta Ads data will be stored date-wise in the database! 🚀
