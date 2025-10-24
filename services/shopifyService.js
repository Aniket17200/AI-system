const axios = require('axios');

class ShopifyService {
  constructor(store, accessToken) {
    this.store = store;
    this.accessToken = accessToken;
    this.baseUrl = `https://${store}/admin/api/2024-01`;
  }

  async getOrders(startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseUrl}/orders.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        params: {
          status: 'any',
          created_at_min: startDate.toISOString(),
          created_at_max: endDate.toISOString(),
          limit: 250
        }
      });
      return response.data.orders || [];
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
