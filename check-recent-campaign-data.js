require('dotenv').config();
const mongoose = require('mongoose');
const MetaAdsService = require('./services/metaAdsService');

async function checkRecentCampaignData() {
  try {
    console.log('🔍 Checking Recent Campaign Data from Meta Ads\n');

    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    const metaAds = new MetaAdsService(user.metaAccessToken, user.metaAdAccountId);

    // Check recent period (October 2025)
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-25');

    console.log(`📅 Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    const campaigns = await metaAds.getCampaigns();
    console.log(`✅ Found ${campaigns.length} total campaigns\n`);

    console.log('Checking first 10 campaigns for recent data...\n');

    let campaignsWithData = 0;
    let totalDays = 0;

    for (let i = 0; i < Math.min(10, campaigns.length); i++) {
      const campaign = campaigns[i];
      console.log(`${i + 1}. ${campaign.name}`);
      
      try {
        const insights = await metaAds.getCampaignInsights(campaign.id, startDate, endDate);
        
        if (insights.length > 0) {
          campaignsWithData++;
          totalDays += insights.length;
          console.log(`   ✅ ${insights.length} days of data`);
          
          // Show sample
          if (insights.length > 0) {
            const sample = insights[0];
            console.log(`   Sample: ${sample.date_start} - Spend: ₹${sample.spend || 0}, Impressions: ${sample.impressions || 0}`);
          }
        } else {
          console.log(`   ⚠️  No data`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY\n');
    console.log(`Campaigns with data: ${campaignsWithData} / 10`);
    console.log(`Total days of data: ${totalDays}`);
    
    if (campaignsWithData > 0) {
      console.log('\n✅ Campaign data IS available!');
      console.log('   Run sync to update database with this data');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkRecentCampaignData();
