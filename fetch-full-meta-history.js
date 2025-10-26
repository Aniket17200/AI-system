const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const MetaAdsService = require('./services/metaAdsService');
require('dotenv').config();

async function fetchFullMetaHistory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user || !user.metaAccessToken || !user.metaAdAccountId) {
      console.log('User or Meta credentials not found');
      return;
    }

    // Get the full date range from database
    const allMetrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    
    if (allMetrics.length === 0) {
      console.log('No metrics in database');
      return;
    }

    const firstDate = new Date(allMetrics[0].date);
    const lastDate = new Date(allMetrics[allMetrics.length - 1].date);
    
    console.log('\n=== DATABASE DATE RANGE ===');
    console.log(`First: ${firstDate.toISOString().split('T')[0]}`);
    console.log(`Last: ${lastDate.toISOString().split('T')[0]}`);
    console.log(`Total days: ${allMetrics.length}`);

    console.log('\n=== FETCHING META ADS FOR FULL RANGE ===');
    const metaAds = new MetaAdsService(user.metaAccessToken, user.metaAdAccountId);
    
    const adsData = await metaAds.getInsights(firstDate, lastDate);
    console.log(`✓ Fetched ${adsData.length} days of Meta Ads data`);
    
    if (adsData.length === 0) {
      console.log('No Meta Ads data returned');
      return;
    }

    const totalMetaSpend = adsData.reduce((sum, ad) => sum + parseFloat(ad.spend || 0), 0);
    console.log(`Total Ad Spend from Meta: ₹${totalMetaSpend.toFixed(2)}`);

    console.log('\n=== UPDATING DATABASE WITH META ADS DATA ===');
    let updated = 0;
    let created = 0;

    for (const ad of adsData) {
      const dateStr = ad.date_start;
      const date = new Date(dateStr + 'T00:00:00.000Z');
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
          console.log(`  ${dateStr}: Orders=${existing.totalOrders}, Revenue=₹${revenue.toFixed(2)}, AdSpend=₹${adSpend.toFixed(2)}, ROAS=${roas.toFixed(2)}`);
        }
      } else {
        // Create new record for days with only ad spend
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
        console.log(`  ${dateStr}: Created (no orders), AdSpend=₹${adSpend.toFixed(2)}`);
      }
    }

    console.log(`\nUpdated: ${updated}, Created: ${created}`);

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const finalMetrics = await DailyMetrics.find({ userId: user._id });
    const totals = finalMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      cogs: acc.cogs + (m.cogs || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, netProfit: 0, cogs: 0, orders: 0 });
    
    const finalROAS = totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0;
    const finalPOAS = totals.adSpend > 0 ? (totals.netProfit / totals.adSpend).toFixed(2) : 0;
    
    console.log(`Total Orders: ${totals.orders}`);
    console.log(`Total Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`Total COGS: ₹${totals.cogs.toFixed(2)}`);
    console.log(`Total Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`Total Net Profit: ₹${totals.netProfit.toFixed(2)}`);
    console.log(`ROAS: ${finalROAS}`);
    console.log(`POAS: ${finalPOAS}`);
    
    console.log('\n=== COMPARISON WITH EXPECTED ===');
    console.log(`Expected ROAS: 8.26 (Current: ${finalROAS}) ${Math.abs(finalROAS - 8.26) < 0.1 ? '✓' : '✗'}`);
    console.log(`Expected POAS: 7.75 (Current: ${finalPOAS}) ${Math.abs(finalPOAS - 7.75) < 0.1 ? '✓' : '✗'}`);
    console.log(`Expected Ad Spend: ₹640,139 (Current: ₹${totals.adSpend.toFixed(2)}) ${Math.abs(totals.adSpend - 640139) < 1000 ? '✓' : '✗'}`);
    
    if (Math.abs(totals.adSpend - 640139) > 1000) {
      console.log(`\n⚠️  Ad Spend difference: ₹${(640139 - totals.adSpend).toFixed(2)}`);
      console.log('Meta API may not have data for all days, or the expected value is from a different source.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fetchFullMetaHistory();
