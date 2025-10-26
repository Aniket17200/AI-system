const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

async function verifyMarketingDataComplete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    console.log('=== USER VERIFICATION ===');
    console.log(`User ID: ${user._id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Meta Access Token: ${user.metaAccessToken ? 'SET ✓' : 'NOT SET ✗'}`);
    console.log(`Meta Ad Account: ${user.metaAdAccountId || 'NOT SET ✗'}`);

    // Get all metrics
    const metrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    console.log(`\n=== DATABASE METRICS ===`);
    console.log(`Total records: ${metrics.length}`);

    // Check marketing data availability
    const withMarketingData = metrics.filter(m => 
      m.adSpend > 0 || m.reach > 0 || m.impressions > 0 || m.linkClicks > 0
    );
    
    console.log(`Records with marketing data: ${withMarketingData.length}`);
    console.log(`Records without marketing data: ${metrics.length - withMarketingData.length}`);

    // Calculate totals
    const totals = metrics.reduce((acc, m) => ({
      adSpend: acc.adSpend + (m.adSpend || 0),
      revenue: acc.revenue + (m.revenue || 0),
      reach: acc.reach + (m.reach || 0),
      impressions: acc.impressions + (m.impressions || 0),
      linkClicks: acc.linkClicks + (m.linkClicks || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { adSpend: 0, revenue: 0, reach: 0, impressions: 0, linkClicks: 0, orders: 0 });

    console.log('\n=== MARKETING TOTALS ===');
    console.log(`Total Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`Total Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`ROAS: ${(totals.revenue / totals.adSpend).toFixed(2)}`);
    console.log(`Total Reach: ${totals.reach.toLocaleString()}`);
    console.log(`Total Impressions: ${totals.impressions.toLocaleString()}`);
    console.log(`Total Link Clicks: ${totals.linkClicks.toLocaleString()}`);
    console.log(`Total Orders: ${totals.orders}`);

    // Check for missing marketing metrics
    console.log('\n=== DATA QUALITY CHECK ===');
    const issues = [];
    
    if (totals.adSpend === 0) issues.push('❌ No ad spend data');
    else console.log('✓ Ad spend data present');
    
    if (totals.reach === 0) issues.push('❌ No reach data');
    else console.log('✓ Reach data present');
    
    if (totals.impressions === 0) issues.push('❌ No impressions data');
    else console.log('✓ Impressions data present');
    
    if (totals.linkClicks === 0) issues.push('❌ No link clicks data');
    else console.log('✓ Link clicks data present');

    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('\n✅ All marketing data is present!');
    }

    // Show sample records with marketing data
    console.log('\n=== SAMPLE RECORDS WITH MARKETING DATA ===');
    const samples = withMarketingData.slice(0, 5);
    samples.forEach(m => {
      console.log(`\n${m.date.toISOString().split('T')[0]}:`);
      console.log(`  Orders: ${m.totalOrders}, Revenue: ₹${m.revenue.toFixed(2)}`);
      console.log(`  Ad Spend: ₹${m.adSpend.toFixed(2)}, ROAS: ${m.roas.toFixed(2)}`);
      console.log(`  Reach: ${m.reach}, Impressions: ${m.impressions}, Clicks: ${m.linkClicks}`);
      console.log(`  CPC: ₹${m.cpc.toFixed(2)}, CTR: ${m.ctr.toFixed(2)}%, CPM: ₹${m.cpm.toFixed(2)}`);
    });

    // Check what frontend will receive
    console.log('\n=== FRONTEND API RESPONSE PREVIEW ===');
    const avgCPC = withMarketingData.length > 0 
      ? withMarketingData.reduce((sum, m) => sum + (m.cpc || 0), 0) / withMarketingData.length 
      : 0;
    const avgCPM = withMarketingData.length > 0 
      ? withMarketingData.reduce((sum, m) => sum + (m.cpm || 0), 0) / withMarketingData.length 
      : 0;
    const avgCTR = withMarketingData.length > 0 
      ? withMarketingData.reduce((sum, m) => sum + (m.ctr || 0), 0) / withMarketingData.length 
      : 0;

    console.log('Summary that frontend will receive:');
    console.log(`  Total Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`  ROAS: ${(totals.revenue / totals.adSpend).toFixed(2)}`);
    console.log(`  Reach: ${totals.reach.toLocaleString()}`);
    console.log(`  Impressions: ${totals.impressions.toLocaleString()}`);
    console.log(`  Link Clicks: ${totals.linkClicks.toLocaleString()}`);
    console.log(`  Avg CPC: ₹${avgCPC.toFixed(2)}`);
    console.log(`  Avg CPM: ₹${avgCPM.toFixed(2)}`);
    console.log(`  Avg CTR: ${avgCTR.toFixed(2)}%`);

    console.log('\n=== CONCLUSION ===');
    if (issues.length === 0 && withMarketingData.length > 0) {
      console.log('✅ Marketing data is complete and ready for frontend');
      console.log('✅ API endpoint will return all required data');
      console.log('✅ Frontend Marketing Dashboard should load successfully');
    } else {
      console.log('⚠️  Marketing data needs attention');
      console.log('Run sync to populate missing data');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyMarketingDataComplete();
