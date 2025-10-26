require('dotenv').config();
const mongoose = require('mongoose');
const MetaAdsService = require('./services/metaAdsService');

async function checkMetaAPICampaigns() {
  try {
    console.log('🔍 Checking Meta Ads API for Campaigns\n');
    console.log('=' .repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    if (!user.metaAccessToken || !user.metaAdAccountId) {
      console.log('❌ No Meta Ads credentials found');
      return;
    }

    console.log('✅ User found with Meta Ads credentials\n');

    const metaAds = new MetaAdsService(user.metaAccessToken, user.metaAdAccountId);

    // Step 1: Get all campaigns
    console.log('📋 Step 1: Fetching all campaigns from Meta Ads API...\n');
    const campaigns = await metaAds.getCampaigns();
    
    console.log(`✅ Found ${campaigns.length} campaigns\n`);
    
    if (campaigns.length > 0) {
      console.log('First 10 campaigns:');
      campaigns.slice(0, 10).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name} (ID: ${c.id}) - Status: ${c.status}`);
      });
    }

    // Step 2: Check campaign insights for a specific date range
    console.log('\n' + '=' .repeat(70));
    console.log('📊 Step 2: Checking campaign insights for date range...\n');

    const startDate = new Date('2025-07-27');
    const endDate = new Date('2025-08-20');

    console.log(`Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    let campaignsWithData = 0;
    let totalInsights = 0;

    console.log('Checking first 5 campaigns for insights...\n');

    for (let i = 0; i < Math.min(5, campaigns.length); i++) {
      const campaign = campaigns[i];
      console.log(`Checking: ${campaign.name}`);
      
      try {
        const insights = await metaAds.getCampaignInsights(campaign.id, startDate, endDate);
        console.log(`  ✅ Found ${insights.length} days of data`);
        
        if (insights.length > 0) {
          campaignsWithData++;
          totalInsights += insights.length;
          
          // Show first 3 days
          insights.slice(0, 3).forEach(insight => {
            console.log(`    ${insight.date_start}: Spend ₹${insight.spend || 0}, Impressions ${insight.impressions || 0}`);
          });
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY\n');
    console.log(`Total Campaigns in Meta Ads: ${campaigns.length}`);
    console.log(`Campaigns with data (checked): ${campaignsWithData} / 5`);
    console.log(`Total insight records: ${totalInsights}`);
    
    if (totalInsights > 0) {
      console.log('\n✅ Campaigns data IS available from Meta Ads API');
      console.log('   Ready to sync to database');
    } else {
      console.log('\n⚠️  No campaign insights found for this date range');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

checkMetaAPICampaigns();
