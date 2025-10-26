const mongoose = require('mongoose');
const User = require('./models/User');
const ShiprocketService = require('./services/shiprocketService');
require('dotenv').config();

async function testShiprocket() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== SHIPROCKET CREDENTIALS ===');
    console.log(`Email: ${user.shiprocketEmail || 'NOT SET'}`);
    console.log(`Password: ${user.shiprocketPassword ? '***' : 'NOT SET'}`);

    if (!user.shiprocketEmail || !user.shiprocketPassword) {
      console.log('\n❌ Shiprocket credentials not configured');
      console.log('Shipping data will not be available until credentials are added.');
      return;
    }

    console.log('\n=== TESTING SHIPROCKET API ===');
    const shiprocket = new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`Fetching shipments from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    try {
      const shipments = await shiprocket.getShipments(startDate, endDate);
      console.log(`✓ Fetched ${shipments.length} shipments`);
      
      if (shipments.length > 0) {
        console.log('\nSample shipment (first):');
        const sample = shipments[0];
        console.log(`  ID: ${sample.id}`);
        console.log(`  Status: ${sample.status}`);
        console.log(`  Created: ${sample.created_at}`);
        console.log(`  Shipping Charges: ₹${sample.shipping_charges || 0}`);
      }
    } catch (error) {
      console.log(`✗ Shiprocket API Error: ${error.message}`);
      if (error.response?.data) {
        console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testShiprocket();
