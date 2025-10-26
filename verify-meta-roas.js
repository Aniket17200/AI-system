const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const MetaAdsService = require('./services/metaAdsService');
require('dotenv').config();

async function verifyMetaAndROAS() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get user
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== USER META ADS CREDENTIALS ===');
    console.log('Meta Access Token:', user.metaAccessToken ? `${user.metaAccessToken.substring(0, 20)}...` : 'NOT SET');
    console.log('Meta Ad Account ID:', user.metaAdAccountId || 'NOT SET');

    if (!user.metaAccessToken || !user.metaAdAccountId) {
      console.log('\n❌ Meta Ads credentials not configured for user');
      return;
    }

    // Test Meta Ads API with Asia/Kolkata timezone
    console.log('\n=== TESTING META ADS API ===');
    const metaAds = new MetaAdsService(user.metaAccessToken, user.metaAdAccountId);
    
    // Get last 90 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    console.log(`Fetching data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    let adsData = [];
    try {
      adsData = await metaAds.getInsights(startDate, endDate);
      console.log(`✓ Fetched ${adsData.length} days of Meta Ads data`);
      
      // Show sample data
      if (adsData.length > 0) {
        console.log('\nSample Meta Ads Data (first 3 days):');
        adsData.slice(0, 3).forEach(ad => {
          console.log(`  Date: ${ad.date_start}, Spend: ${ad.spend}, Impressions: ${ad.impressions}, Clicks: ${ad.clicks}`);
        });
      }
      
      // Calculate total ad spend
      const totalAdSpend = adsData.reduce((sum, ad) => sum + parseFloat(ad.spend || 0), 0);
      console.log(`\nTotal Ad Spend from Meta API: ₹${totalAdSpend.toFixed(2)}`);
      
    } catch (error) {
      console.log('❌ Meta Ads API Error:', error.response?.data || error.message);
      if (error.response?.data) {
        console.log('Full error:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Check database metrics with Asia/Kolkata timezone
    console.log('\n=== DATABASE METRICS (Asia/Kolkata UTC+5:30) ===');
    
    // Get all metrics for the user
    const allMetrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    console.log(`Total records in database: ${allMetrics.length}`);
    
    if (allMetrics.length > 0) {
      // Calculate totals
      const totals = allMetrics.reduce((acc, m) => ({
        revenue: acc.revenue + (m.revenue || 0),
        adSpend: acc.adSpend + (m.adSpend || 0),
        netProfit: acc.netProfit + (m.netProfit || 0),
        orders: acc.orders + (m.totalOrders || 0)
      }), { revenue: 0, adSpend: 0, netProfit: 0, orders: 0 });
      
      const calculatedROAS = totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0;
      const calculatedPOAS = totals.adSpend > 0 ? (totals.netProfit / totals.adSpend).toFixed(2) : 0;
      
      console.log('\nAggregated Totals:');
      console.log(`  Total Revenue: ₹${totals.revenue.toFixed(2)}`);
      console.log(`  Total Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
      console.log(`  Total Net Profit: ₹${totals.netProfit.toFixed(2)}`);
      console.log(`  Total Orders: ${totals.orders}`);
      console.log(`  Calculated ROAS: ${calculatedROAS}`);
      console.log(`  Calculated POAS: ${calculatedPOAS}`);
      
      console.log('\n=== EXPECTED VALUES ===');
      console.log('  Expected ROAS: 8.26');
      console.log('  Expected POAS: 7.75');
      console.log('  Expected Ad Spend: ₹640,139');
      
      console.log('\n=== COMPARISON ===');
      console.log(`  ROAS Match: ${calculatedROAS == 8.26 ? '✓' : '✗'} (DB: ${calculatedROAS}, Expected: 8.26)`);
      console.log(`  POAS Match: ${calculatedPOAS == 7.75 ? '✓' : '✗'} (DB: ${calculatedPOAS}, Expected: 7.75)`);
      console.log(`  Ad Spend Match: ${Math.abs(totals.adSpend - 640139) < 100 ? '✓' : '✗'} (DB: ${totals.adSpend.toFixed(2)}, Expected: 640139)`);
      
      // Show date range
      const firstDate = new Date(allMetrics[0].date);
      const lastDate = new Date(allMetrics[allMetrics.length - 1].date);
      
      // Convert to Asia/Kolkata timezone for display
      const kolkataOffset = 5.5 * 60; // +5:30 in minutes
      const firstDateKolkata = new Date(firstDate.getTime() + kolkataOffset * 60000);
      const lastDateKolkata = new Date(lastDate.getTime() + kolkataOffset * 60000);
      
      console.log(`\nDate Range: ${firstDateKolkata.toISOString().split('T')[0]} to ${lastDateKolkata.toISOString().split('T')[0]}`);
      
      // Show records with ad spend
      const recordsWithAdSpend = allMetrics.filter(m => m.adSpend > 0);
      console.log(`\nRecords with Ad Spend: ${recordsWithAdSpend.length}`);
      
      if (recordsWithAdSpend.length > 0) {
        console.log('\nSample records with Ad Spend (first 5):');
        recordsWithAdSpend.slice(0, 5).forEach(m => {
          const dateKolkata = new Date(new Date(m.date).getTime() + kolkataOffset * 60000);
          console.log(`  ${dateKolkata.toISOString().split('T')[0]}: Revenue=₹${m.revenue.toFixed(2)}, AdSpend=₹${m.adSpend.toFixed(2)}, ROAS=${m.roas.toFixed(2)}, POAS=${m.poas.toFixed(2)}`);
        });
      }
      
      // Check for records without ad spend
      const recordsWithoutAdSpend = allMetrics.filter(m => m.adSpend === 0);
      if (recordsWithoutAdSpend.length > 0) {
        console.log(`\n⚠️  Warning: ${recordsWithoutAdSpend.length} records have zero ad spend`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyMetaAndROAS();
