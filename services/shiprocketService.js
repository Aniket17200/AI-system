const axios = require('axios');

class ShiprocketService {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: this.email,
        password: this.password
      });
      this.token = response.data.token;
      return this.token;
    } catch (error) {
      console.error('Shiprocket Auth Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getShipments(startDate, endDate) {
    if (!this.token) await this.authenticate();
    
    try {
      const response = await axios.get(`${this.baseUrl}/shipments`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        params: {
          filter_by_date: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Shiprocket Shipments Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = ShiprocketService;
