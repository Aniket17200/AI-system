const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const MetaAdsService = require('./services/metaAdsService');
require('dotenv').config();

function convertToKolkataDate(dateString) {
  const date = new Date(dateString);
  const kolkataDate = new Date(date.toISOString().split('T')[0] + 'T00:00:00.000Z');
  return kolkataDate;
}

async function syncMetaFullRange() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user || !user.metaAccessToken || !user.metaAdAccountId) {
      console.log('User or Meta credentials not found');
      return;
    }

    // Find the date range from existing orders
    const metricsWithOrders = await DailyMetrics.find({ 
      userId: user._id, 
      totalOrders: { $gt: 0 } 
    }).sort({ date: 1 });

    if (metricsWithOrders.length === 0) {
      console.log('No orders found');
      return;
    }

    const startDate = new Date(metricsWithOrders[0].date);
    const endDate = new Date(metricsWithOrders[metricsWithOrders.length - 1].date);
    
    console.log(`\n=== DATE RANGE ===`);
    console.log(`Start: ${startDate.toISOString().split('T')[0]}`);
    console.log(`End: ${endDate.toISOString().split('T')[0]}`);
    console.log(`Days with orders: ${metricsWithOrders.length}`);

    console.log('\n=== FETCHING META ADS DATA ===');
    const metaAds = new MetaAdsService(user.metaAccessToken, user.metaAdAccountId);
    
    const adsData = await metaAds.getInsights(startDate, endDate);
    console.log(`✓ Fetched ${adsData.length} days of Meta Ads data`);
    
    const totalMetaSpend = adsData.reduce((sum, ad) => sum + parseFloat(ad.spend || 0), 0);
    console.log(`Total Meta Ad Spend: ₹${totalMetaSpend.toFixed(2)}`);

    console.log('\n=== UPDATING DATABASE ===');
    let updated = 0;
    let created = 0;

    for (const ad of adsData) {
      const date = convertToKolkataDate(ad.date_start);
      const adSpend = parseFloat(ad.spend || 0);
      
      const existing = await DailyMetrics.findOne({ userId: user._id, date: date });

      if (existing) {
        const revenue = existing.revenue || 0;
        const cogs = existing.cogs || 0;
        const shippingCost = existing.shippingCost || 0;
        
        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - adSpend - shippingCost;
        const roas = adSpend > 0 ? revenue / adSpend : 0;
        const poas = adSpend > 0 ? netProfit / adSpend : 0;
        const cpp = existing.totalOrders > 0 ? adSpend / existing.totalOrders : 0;
        
        const reach = parseInt(ad.reach || 0);
        const impressions = parseInt(ad.impressions || 0);
        const linkClicks = parseInt(ad.clicks || 0);
        const cpc = linkClicks > 0 ? adSpend / linkClicks : 0;
        const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
        const cpm = impressions > 0 ? (adSpend / impressions) * 1000 : 0;

        await DailyMetrics.updateOne(
          { _id: existing._id },
          {
            $set: {
              adSpend,
              netProfit,
              netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
              roas,
              poas,
              cpp,
              reach,
              impressions,
              linkClicks,
              cpc,
              ctr,
              cpm
            }
          }
        );
        
        updated++;
        if (existing.totalOrders > 0) {
          console.log(`  Updated ${ad.date_start}: Orders=${existing.totalOrders}, Revenue=₹${revenue.toFixed(2)}, AdSpend=₹${adSpend.toFixed(2)}, ROAS=${roas.toFixed(2)}`);
        }
      } else {
        const reach = parseInt(ad.reach || 0);
        const impressions = parseInt(ad.impressions || 0);
        const linkClicks = parseInt(ad.clicks || 0);
        const cpc = linkClicks > 0 ? adSpend / linkClicks : 0;
        const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
        const cpm = impressions > 0 ? (adSpend / impressions) * 1000 : 0;

        await DailyMetrics.create({
          userId: user._id,
          date: date,
          totalOrders: 0,
          revenue: 0,
          cogs: 0,
          adSpend,
          shippingCost: 0,
          grossProfit: 0,
          grossProfitMargin: 0,
          netProfit: -adSpend,
          netProfitMargin: 0,
          roas: 0,
          poas: 0,
          aov: 0,
          cpp: 0,
          reach,
          impressions,
          linkClicks,
          cpc,
          ctr,
          cpm
        });
        
        created++;
      }
    }

    console.log(`\nUpdated: ${updated}, Created: ${created}`);

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const allMetrics = await DailyMetrics.find({ userId: user._id });
    const totals = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      cogs: acc.cogs + (m.cogs || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, netProfit: 0, cogs: 0, orders: 0 });
    
    const calculatedROAS = totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0;
    const calculatedPOAS = totals.adSpend > 0 ? (totals.netProfit / totals.adSpend).toFixed(2) : 0;
    
    console.log(`Total Orders: ${totals.orders}`);
    console.log(`Total Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`Total COGS: ₹${totals.cogs.toFixed(2)}`);
    console.log(`Total Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`Total Net Profit: ₹${totals.netProfit.toFixed(2)}`);
    console.log(`Calculated ROAS: ${calculatedROAS}`);
    console.log(`Calculated POAS: ${calculatedPOAS}`);
    
    console.log('\n=== EXPECTED VALUES ===');
    console.log(`ROAS: 8.26 (Current: ${calculatedROAS}) ${calculatedROAS == 8.26 ? '✓' : '✗'}`);
    console.log(`POAS: 7.75 (Current: ${calculatedPOAS}) ${calculatedPOAS == 7.75 ? '✓' : '✗'}`);
    console.log(`Ad Spend: ₹640,139 (Current: ₹${totals.adSpend.toFixed(2)}) ${Math.abs(totals.adSpend - 640139) < 1000 ? '✓' : '✗'}`);
    
    // Calculate what revenue should be for expected ROAS
    const expectedRevenue = 640139 * 8.26;
    console.log(`\nFor ROAS 8.26 with Ad Spend ₹640,139:`);
    console.log(`Expected Revenue: ₹${expectedRevenue.toFixed(2)}`);
    console.log(`Current Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`Difference: ₹${(totals.revenue - expectedRevenue).toFixed(2)}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

syncMetaFullRange();
