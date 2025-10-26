const axios = require('axios');

class ShopifyService {
  constructor(store, accessToken) {
    this.store = store;
    this.accessToken = accessToken;
    this.baseUrl = `https://${store}/admin/api/2024-01`;
  }

  async getOrders(startDate, endDate) {
    try {
      let allOrders = [];
      let url = `${this.baseUrl}/orders.json`;
      let params = {
        status: 'any',
        created_at_min: startDate.toISOString(),
        created_at_max: endDate.toISOString(),
        limit: 250
      };

      // Handle pagination
      while (url) {
        const response = await axios.get(url, {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          },
          params: url === `${this.baseUrl}/orders.json` ? params : undefined
        });

        const orders = response.data.orders || [];
        allOrders = allOrders.concat(orders);

        // Check for next page in Link header
        const linkHeader = response.headers['link'];
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
          if (nextMatch) {
            url = nextMatch[1];
            params = undefined; // Don't send params for paginated requests
          } else {
            url = null;
          }
        } else {
          url = null;
        }
      }

      console.log(`Fetched ${allOrders.length} orders from Shopify`);
      return allOrders;
    } catch (error) {
      console.error('Shopify API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getProducts() {
    try {
      const response = await axios.get(`${this.baseUrl}/products.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        params: { limit: 250 }
      });
      return response.data.products || [];
    } catch (error) {
      console.error('Shopify Products Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCustomers() {
    try {
      const response = await axios.get(`${this.baseUrl}/customers.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        params: { limit: 250 }
      });
      return response.data.customers || [];
    } catch (error) {
      console.error('Shopify Customers Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = ShopifyService;
