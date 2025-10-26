require('dotenv').config();
const mongoose = require('mongoose');
const ShiprocketService = require('./services/shiprocketService');

async function checkShiprocketDates() {
  try {
    console.log('🔍 Checking Shiprocket Date Ranges\n');

    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    const shiprocket = new ShiprocketService(user.shiprocketEmail, user.shiprocketPassword);

    // Fetch shipments for October 2024 (where the data actually is)
    const startDate = new Date('2024-10-01');
    const endDate = new Date('2024-10-31');

    console.log(`📅 Fetching: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    const shipments = await shiprocket.getShipments(startDate, endDate);

    console.log(`✅ Found ${shipments.length} shipments\n`);

    if (shipments.length > 0) {
      // Parse dates and group
      const dates = {};
      shipments.forEach(s => {
        const dateMatch = s.created_at.match(/(\d+)(st|nd|rd|th)\s+(\w+)\s+(\d{4})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const monthStr = dateMatch[3];
          const year = dateMatch[4];
          
          const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          
          const month = months[monthStr];
          if (month) {
            const dateStr = `${year}-${month}-${day}`;
            dates[dateStr] = (dates[dateStr] || 0) + 1;
          }
        }
      });

      console.log('Shipments by date:');
      Object.keys(dates).sort().forEach(date => {
        console.log(`  ${date}: ${dates[date]} shipments`);
      });

      console.log(`\n📊 Date range: ${Object.keys(dates).sort()[0]} to ${Object.keys(dates).sort().pop()}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkShiprocketDates();
