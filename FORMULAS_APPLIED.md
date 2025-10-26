# Formulas Applied - COGS = Revenue/2 ✅

## Formulas Implemented

I've updated the backend to use the exact formulas you specified:

### 1. Key Formulas
- ✅ **Revenue (R)** = Sum of all order amounts
- ✅ **COGS** = Revenue / 2
- ✅ **Ad Spend (A)** = Total amount spent on ads
- ✅ **Shipping Cost (S)** = Total logistics and shipping expense
- ✅ **Gross Profit (GP)** = R − COGS
- ✅ **Net Profit (NP)** = R − (COGS + A + S)

### 2. Derived Metrics
- ✅ **Gross Profit Margin (%)** = (GP / R) × 100
- ✅ **Net Profit Margin (%)** = (NP / R) × 100
- ✅ **Average Order Value (AOV)** = R ÷ Total Orders
- ✅ **Return on Ad Spend (ROAS)** = R ÷ A
- ✅ **Profit on Ad Spend (POAS)** = NP ÷ A

## Current Data (Last 30 Days)

**Date Range**: Sep 26 - Oct 25, 2025

### With New Formulas:
- Total Orders: **481**
- Revenue: **₹8,28,930**
- COGS: **₹4,14,465** (Revenue / 2)
- Ad Spend: **₹36,529**
- Shipping Cost: **₹10,285**
- Net Profit: **₹3,67,652**
- Gross Profit: **₹4,14,465**
- Gross Profit Margin: **50.0%**
- Net Profit Margin: **44.4%**
- ROAS: **22.69**
- POAS: **10.06**
- Avg Order Value: **₹1,723**

## All Available Data

**Date Range**: Jul 24 - Oct 25, 2025 (96 days)

### With New Formulas:
- Total Orders: **926**
- Revenue: **₹16,50,610**
- COGS: **₹8,25,305** (Revenue / 2)
- Ad Spend: **₹1,16,238**
- Shipping Cost: **₹34,198**
- Net Profit: **₹6,74,869**
- Gross Profit: **₹8,25,305**
- Gross Profit Margin: **50.0%**
- Net Profit Margin: **40.9%**
- ROAS: **14.20**
- POAS: **5.81**
- Avg Order Value: **₹1,782**

## About the 3454 Orders

You mentioned the correct data should be:
- Total Orders: 3454
- Revenue: ₹56,03,908
- ROAS: 8.25
- POAS: 7.75
- AOV: ₹1,622

**This data doesn't match any query I've run on your database.**

Possible explanations:
1. **Different User**: Data from a different user account
2. **Different Date Range**: A specific date range I haven't tested
3. **Multiple Users Combined**: Sum of all users' data
4. **Different Database**: Data from a different database/collection
5. **Historical Data**: Data that was previously in the system

### All Users Combined:
- User 1 (68c812b0afc4892c1f8128e3): 926 orders
- User 2 (68f649b5e4463e191613c149): 250 orders
- User 3 (68fb223df39b1cbfd3de3bc4): 1597 orders
- **Total**: 2773 orders (still not 3454)

## What I've Done

### Backend Changes
**File**: `routes/dataRoutes.js`

1. ✅ Changed COGS calculation to `Revenue / 2`
2. ✅ Recalculated Gross Profit as `Revenue - COGS`
3. ✅ Recalculated Net Profit as `Revenue - (COGS + Ad Spend + Shipping)`
4. ✅ Updated all derived metrics (margins, ROAS, POAS, AOV)
5. ✅ Applied formulas to daily chart data
6. ✅ Updated financial breakdown pie chart

### Formulas Applied:
```javascript
// COGS = Revenue / 2
const cogs = totals.revenue / 2;

// Gross Profit = Revenue - COGS
const grossProfit = totals.revenue - cogs;

// Net Profit = Revenue - (COGS + Ad Spend + Shipping Cost)
const netProfit = totals.revenue - (cogs + totals.adSpend + totals.shippingCost);

// Gross Profit Margin (%) = (Gross Profit / Revenue) × 100
const avgGrossProfitMargin = totals.revenue > 0 ? (grossProfit / totals.revenue) * 100 : 0;

// Net Profit Margin (%) = (Net Profit / Revenue) × 100
const avgNetProfitMargin = totals.revenue > 0 ? (netProfit / totals.revenue) * 100 : 0;

// Average Order Value (AOV) = Revenue ÷ Total Orders
const avgAOV = totals.totalOrders > 0 ? totals.revenue / totals.totalOrders : 0;

// Return on Ad Spend (ROAS) = Revenue ÷ Ad Spend
const avgROAS = totals.adSpend > 0 ? totals.revenue / totals.adSpend : 0;

// Profit on Ad Spend (POAS) = Net Profit ÷ Ad Spend
const avgPOAS = totals.adSpend > 0 ? netProfit / totals.adSpend : 0;
```

## Status

✅ **Formulas**: All implemented correctly
✅ **COGS**: Now calculated as Revenue / 2
✅ **Gross Profit**: Revenue - COGS (50% of revenue)
✅ **Net Profit**: Revenue - (COGS + Ad Spend + Shipping)
✅ **All Metrics**: Recalculated with new formulas
✅ **Backend**: Running with updated calculations

## Next Steps

To show the data you mentioned (3454 orders, ₹56,03,908), I need to know:

1. **Which date range** should show this data?
2. **Which user** should show this data?
3. **Is this data** from a different source/database?
4. **Should I combine** multiple users' data?

Please clarify and I'll adjust the calculations accordingly.

## Test the Changes

**Backend is running on port 6000**

Test with:
```bash
# Last 30 days
curl "http://localhost:6000/api/data/dashboard?userId=68c812b0afc4892c1f8128e3&startDate=2025-09-26&endDate=2025-10-25"

# All data
curl "http://localhost:6000/api/data/dashboard?userId=68c812b0afc4892c1f8128e3&startDate=2025-07-01&endDate=2025-10-31"
```

**Frontend**: Start with `cd client && npm run dev`

The formulas are now correctly applied. The data shown will depend on the date range selected.
