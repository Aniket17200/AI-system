require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
const ProductCost = require('./models/ProductCost');
const DataSyncService = require('./services/dataSyncService');
const dataSyncService = new DataSyncService();

async function resyncAnurag() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('=== Re-syncing Data for ' + user.email + ' ===\n');
    console.log('User ID: ' + user._id);

    // Step 1: Clear existing data
    console.log('\nStep 1: Clearing existing data...');
    const deletedMetrics = await DailyMetrics.deleteMany({ userId: user._id });
    const deletedCosts = await ProductCost.deleteMany({ userId: user._id });
    console.log(`✓ Deleted ${deletedMetrics.deletedCount} metrics`);
    console.log(`✓ Deleted ${deletedCosts.deletedCount} product costs`);

    // Step 2: Sync fresh data (1 year back)
    console.log('\nStep 2: Syncing fresh data from APIs...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    console.log(`Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    console.log('This will fetch:');
    console.log('  - Shopify orders');
    console.log('  - Meta Ads campaigns (with proper aggregation)');
    console.log('  - Shiprocket shipments\n');

    const result = await dataSyncService.syncUserData(
      user,
      startDate,
      endDate
    );

    console.log('\n=== Sync Complete ===\n');
    console.log('Records Synced: ' + (result.recordsSynced || 0));
    console.log('Errors: ' + (result.errors?.length || 0));

    // Step 3: Verify data
    console.log('\nStep 3: Verifying synced data...');
    const metricsCount = await DailyMetrics.countDocuments({ userId: user._id });
    console.log(`✓ Total metrics records: ${metricsCount}`);

    if (metricsCount > 0) {
      const allMetrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
      
      const oldest = allMetrics[0];
      const newest = allMetrics[allMetrics.length - 1];
      
      console.log('\nDate Range:');
      console.log(`  From: ${oldest.date.toISOString().split('T')[0]}`);
      console.log(`  To: ${newest.date.toISOString().split('T')[0]}`);
      
      // Calculate totals
      const totals = allMetrics.reduce((acc, m) => ({
        revenue: acc.revenue + (m.revenue || 0),
        orders: acc.orders + (m.totalOrders || 0),
        adSpend: acc.adSpend + (m.adSpend || 0),
        reach: acc.reach + (m.reach || 0),
        impressions: acc.impressions + (m.impressions || 0),
        clicks: acc.clicks + (m.linkClicks || 0)
      }), { revenue: 0, orders: 0, adSpend: 0, reach: 0, impressions: 0, clicks: 0 });

      console.log('\nTotal Summary:');
      console.log(`  Total Revenue: ₹${totals.revenue.toLocaleString()}`);
      console.log(`  Total Orders: ${totals.orders}`);
      console.log(`  Total Ad Spend: ₹${totals.adSpend.toLocaleString()}`);
      console.log(`  Overall ROAS: ${totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0}x`);
      console.log(`  Total Reach: ${totals.reach.toLocaleString()}`);
      console.log(`  Total Impressions: ${totals.impressions.toLocaleString()}`);
      console.log(`  Total Clicks: ${totals.clicks.toLocaleString()}`);
      
      // Show sample with campaigns
      console.log('\nSample Day with Campaigns:');
      const sampleWithCampaigns = allMetrics.find(m => m.campaigns && m.campaigns.length > 0);
      if (sampleWithCampaigns) {
        console.log(`  Date: ${sampleWithCampaigns.date.toISOString().split('T')[0]}`);
        console.log(`  Revenue: ₹${sampleWithCampaigns.revenue || 0}`);
        console.log(`  Ad Spend: ₹${(sampleWithCampaigns.adSpend || 0).toFixed(2)}`);
        console.log(`  Campaigns: ${sampleWithCampaigns.campaigns.length}`);
        console.log(`  Reach: ${sampleWithCampaigns.reach || 0}`);
        console.log(`  Impressions: ${sampleWithCampaigns.impressions || 0}`);
      }
    }

    // Update user's lastSyncAt
    await User.updateOne(
      { _id: user._id },
      { $set: { lastSyncAt: new Date() } }
    );

    await mongoose.connection.close();
    console.log('\n✓ Done! Data is properly synced with correct aggregation.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resyncAnurag();
