require('dotenv').config();
const mongoose = require('mongoose');
const ShiprocketService = require('./services/shiprocketService');

async function inspectShiprocketData() {
  try {
    console.log('🔍 Inspecting Shiprocket Data Structure\n');

    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    const shiprocket = new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword);

    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-25');

    console.log('Fetching shipments...\n');
    const shipments = await shiprocket.getShipments(startDate, endDate);

    console.log(`✅ Found ${shipments.length} shipments\n`);

    if (shipments.length > 0) {
      console.log('First shipment structure:');
      console.log(JSON.stringify(shipments[0], null, 2));
      
      console.log('\n\nAvailable fields:');
      console.log(Object.keys(shipments[0]).join(', '));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

inspectShiprocketData();
