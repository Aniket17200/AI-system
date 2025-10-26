const mongoose = require('mongoose');
const User = require('./models/User');
const ShiprocketService = require('./services/shiprocketService');
require('dotenv').config();

async function checkShipmentDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    const shiprocket = new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    const shipments = await shiprocket.getShipments(startDate, endDate);
    console.log(`Fetched ${shipments.length} shipments`);
    
    if (shipments.length > 0) {
      console.log('\nSample shipment dates (first 10):');
      shipments.slice(0, 10).forEach(s => {
        console.log(`  ${s.created_at} - Status: ${s.status}`);
      });
      
      console.log('\nLast 5 shipments:');
      shipments.slice(-5).forEach(s => {
        console.log(`  ${s.created_at} - Status: ${s.status}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkShipmentDates();
