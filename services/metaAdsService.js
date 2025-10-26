const axios = require('axios');

class MetaAdsService {
  constructor(accessToken, adAccountId) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getInsights(startDate, endDate) {
    try {
      // Remove 'act_' prefix if it's already in the adAccountId
      const accountId = this.adAccountId.startsWith('act_') 
        ? this.adAccountId 
        : `act_${this.adAccountId}`;

      const response = await axios.get(
        `${this.baseUrl}/${accountId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            time_range: JSON.stringify({
              since: startDate.toISOString().split('T')[0],
              until: endDate.toISOString().split('T')[0]
            }),
            fields: 'spend,reach,impressions,clicks,ctr,cpc,cpm,purchase_roas',
            level: 'account',
            time_increment: 1
          }
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Meta Ads API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCampaigns() {
    try {
      const accountId = this.adAccountId.startsWith('act_') 
        ? this.adAccountId 
        : `act_${this.adAccountId}`;

      const response = await axios.get(
        `${this.baseUrl}/${accountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,status,objective',
            limit: 100
          }
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Meta Ads Campaigns Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCampaignInsights(campaignId, startDate, endDate) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${campaignId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            time_range: JSON.stringify({
              since: startDate.toISOString().split('T')[0],
              until: endDate.toISOString().split('T')[0]
            }),
            fields: 'spend,reach,impressions,clicks',
            level: 'campaign'
          }
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Campaign ${campaignId} Insights Error:`, error.response?.data || error.message);
      return [];
    }
  }
}

module.exports = MetaAdsService;
