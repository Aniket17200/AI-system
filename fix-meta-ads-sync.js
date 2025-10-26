const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const MetaAdsService = require('./services/metaAdsService');
require('dotenv').config();

// Asia/Kolkata timezone offset: UTC +5:30
const KOLKATA_OFFSET_MINUTES = 5.5 * 60;

function convertToKolkataDate(dateString) {
  // Parse the date and ensure it's in Kolkata timezone
  const date = new Date(dateString);
  // Store as UTC midnight for the Kolkata date
  const kolkataDate = new Date(date.toISOString().split('T')[0] + 'T00:00:00.000Z');
  return kolkataDate;
}

async function fixMetaAdsSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    if (!user.metaAccessToken || !user.metaAdAccountId) {
      console.log('Meta Ads credentials not configured');
      return;
    }

    console.log('\n=== FETCHING META ADS DATA ===');
    const metaAds = new MetaAdsService(user.metaAccessToken, user.metaAdAccountId);
    
    // Get last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    console.log(`Fetching from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    const adsData = await metaAds.getInsights(startDate, endDate);
    console.log(`✓ Fetched ${adsData.length} days of Meta Ads data`);
    
    if (adsData.length === 0) {
      console.log('No Meta Ads data to sync');
      return;
    }

    console.log('\n=== UPDATING DATABASE ===');
    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const ad of adsData) {
      try {
        const date = convertToKolkataDate(ad.date_start);
        const adSpend = parseFloat(ad.spend || 0);
        
        // Find existing record
        const existing = await DailyMetrics.findOne({ 
          userId: user._id, 
          date: date 
        });

        if (existing) {
          // Update ad spend and recalculate metrics
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
          console.log(`  Updated ${ad.date_start}: AdSpend=₹${adSpend.toFixed(2)}, ROAS=${roas.toFixed(2)}, POAS=${poas.toFixed(2)}`);
        } else {
          // Create new record with only ad data (no orders)
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
          console.log(`  Created ${ad.date_start}: AdSpend=₹${adSpend.toFixed(2)} (no orders)`);
        }
      } catch (error) {
        console.error(`  Error processing ${ad.date_start}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n=== SYNC COMPLETE ===`);
    console.log(`Updated: ${updated} records`);
    console.log(`Created: ${created} records`);
    console.log(`Skipped: ${skipped} records`);

    // Verify totals
    console.log('\n=== VERIFICATION ===');
    const allMetrics = await DailyMetrics.find({ userId: user._id });
    const totals = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, netProfit: 0, orders: 0 });
    
    const calculatedROAS = totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0;
    const calculatedPOAS = totals.adSpend > 0 ? (totals.netProfit / totals.adSpend).toFixed(2) : 0;
    
    console.log(`Total Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`Total Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`Total Net Profit: ₹${totals.netProfit.toFixed(2)}`);
    console.log(`Calculated ROAS: ${calculatedROAS}`);
    console.log(`Calculated POAS: ${calculatedPOAS}`);
    
    console.log('\nExpected:');
    console.log(`  ROAS: 8.26`);
    console.log(`  POAS: 7.75`);
    console.log(`  Ad Spend: ₹640,139`);
    
    console.log('\nMatch:');
    console.log(`  ROAS: ${calculatedROAS == 8.26 ? '✓' : '✗'} (${calculatedROAS})`);
    console.log(`  POAS: ${calculatedPOAS == 7.75 ? '✓' : '✗'} (${calculatedPOAS})`);
    console.log(`  Ad Spend: ${Math.abs(totals.adSpend - 640139) < 1000 ? '✓' : '✗'} (₹${totals.adSpend.toFixed(2)})`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixMetaAdsSync();
