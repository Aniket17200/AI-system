const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testMetaCampaigns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    const accessToken = user.metaAccessToken;
    const adAccountId = user.metaAdAccountId.startsWith('act_') 
      ? user.metaAdAccountId 
      : `act_${user.metaAdAccountId}`;
    
    console.log('=== TESTING META ADS API FOR CAMPAIGNS ===\n');
    console.log('Ad Account:', adAccountId);
    
    // Test 1: Get list of campaigns
    console.log('\n--- Test 1: Fetching Campaigns List ---');
    try {
      const campaignsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${adAccountId}/campaigns`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,status,objective',
            limit: 100
          }
        }
      );
      
      const campaigns = campaignsResponse.data.data || [];
      console.log(`✓ Found ${campaigns.length} campaigns\n`);
      
      if (campaigns.length > 0) {
        console.log('Campaigns:');
        campaigns.forEach((campaign, index) => {
          console.log(`  ${index + 1}. ${campaign.name}`);
          console.log(`     ID: ${campaign.id}`);
          console.log(`     Status: ${campaign.status}`);
          console.log(`     Objective: ${campaign.objective || 'N/A'}`);
        });
        
        // Test 2: Get insights for each campaign
        console.log('\n--- Test 2: Fetching Campaign Insights ---');
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        for (const campaign of campaigns.slice(0, 5)) { // Test first 5 campaigns
          try {
            const insightsResponse = await axios.get(
              `https://graph.facebook.com/v18.0/${campaign.id}/insights`,
              {
                params: {
                  access_token: accessToken,
                  time_range: JSON.stringify({
                    since: startDate.toISOString().split('T')[0],
                    until: endDate.toISOString().split('T')[0]
                  }),
                  fields: 'spend,impressions,clicks,reach',
                  level: 'campaign'
                }
              }
            );
            
            const insights = insightsResponse.data.data || [];
            if (insights.length > 0) {
              const totalSpend = insights.reduce((sum, i) => sum + parseFloat(i.spend || 0), 0);
              const totalImpressions = insights.reduce((sum, i) => sum + parseInt(i.impressions || 0), 0);
              const totalClicks = insights.reduce((sum, i) => sum + parseInt(i.clicks || 0), 0);
              
              console.log(`\n${campaign.name}:`);
              console.log(`  Spend: ₹${totalSpend.toFixed(2)}`);
              console.log(`  Impressions: ${totalImpressions.toLocaleString()}`);
              console.log(`  Clicks: ${totalClicks.toLocaleString()}`);
            } else {
              console.log(`\n${campaign.name}: No data in date range`);
            }
          } catch (error) {
            console.log(`\n${campaign.name}: Error fetching insights - ${error.message}`);
          }
        }
        
      } else {
        console.log('No campaigns found in this ad account.');
      }
      
    } catch (error) {
      console.error('✗ Error fetching campaigns:', error.response?.data || error.message);
      if (error.response?.data) {
        console.log('\nFull error:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // Test 3: Compare with account-level data
    console.log('\n--- Test 3: Account-Level Data (Current Method) ---');
    try {
      const accountResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${adAccountId}/insights`,
        {
          params: {
            access_token: accessToken,
            time_range: JSON.stringify({
              since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              until: new Date().toISOString().split('T')[0]
            }),
            fields: 'spend,impressions,clicks,reach',
            level: 'account',
            time_increment: 1
          }
        }
      );
      
      const accountData = accountResponse.data.data || [];
      const totalSpend = accountData.reduce((sum, d) => sum + parseFloat(d.spend || 0), 0);
      const totalImpressions = accountData.reduce((sum, d) => sum + parseInt(d.impressions || 0), 0);
      const totalClicks = accountData.reduce((sum, d) => sum + parseInt(d.clicks || 0), 0);
      
      console.log('Account-Level Totals (Last 30 days):');
      console.log(`  Spend: ₹${totalSpend.toFixed(2)}`);
      console.log(`  Impressions: ${totalImpressions.toLocaleString()}`);
      console.log(`  Clicks: ${totalClicks.toLocaleString()}`);
      console.log(`  Days: ${accountData.length}`);
      
    } catch (error) {
      console.error('✗ Error fetching account data:', error.message);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

testMetaCampaigns();
