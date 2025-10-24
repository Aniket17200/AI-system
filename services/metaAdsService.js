const axios = require('axios');

class MetaAdsService {
  constructor(accessToken, adAccountId) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getInsights(startDate, endDate) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/act_${this.adAccountId}/insights`,
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
}

module.exports = MetaAdsService;
