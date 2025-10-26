require('dotenv').config();
const mongoose = require('mongoose');
const ShiprocketService = require('./services/shiprocketService');

async function testShiprocketAPI() {
  try {
    console.log('🧪 Testing Shiprocket API\n');
    console.log('=' .repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    if (!user.shiprocketEmail || !user.shiprocketPassword) {
      console.log('❌ No Shiprocket credentials found');
      console.log('\nUser credentials:');
      console.log(`  Email: ${user.shiprocketEmail || 'NOT SET'}`);
      console.log(`  Password: ${user.shiprocketPassword ? 'SET' : 'NOT SET'}`);
      return;
    }

    console.log('✅ User found with Shiprocket credentials\n');
    console.log(`Email: ${user.shiprocketEmail}`);

    const shiprocket = new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword);

    // Test different date ranges
    const dateRanges = [
      { name: 'October 2025', start: new Date('2025-10-01'), end: new Date('2025-10-25') },
      { name: 'September 2025', start: new Date('2025-09-01'), end: new Date('2025-09-30') },
      { name: 'August 2025', start: new Date('2025-08-01'), end: new Date('2025-08-31') },
    ];

    for (const range of dateRanges) {
      console.log(`\n📅 Testing: ${range.name}`);
      console.log(`   ${range.start.toISOString().split('T')[0]} to ${range.end.toISOString().split('T')[0]}`);
      
      try {
        const shipments = await shiprocket.getShipments(range.start, range.end);
        console.log(`   ✅ Found ${shipments.length} shipments`);
        
        if (shipments.length > 0) {
          console.log('\n   Sample shipments:');
          shipments.slice(0, 3).forEach((s, i) => {
            console.log(`     ${i + 1}. Order ${s.order_id} - Status: ${s.status} - Date: ${s.order_date}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

testShiprocketAPI();
