require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    
    if (user) {
      console.log('✓ User found!');
      console.log(`  Email: ${user.email}`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Created: ${user.createdAt}`);
      
      // Check if user has data
      const DailyMetrics = require('./models/DailyMetrics');
      const metricsCount = await DailyMetrics.countDocuments({ userId: user._id });
      console.log(`  Metrics records: ${metricsCount}`);
      
      if (metricsCount > 0) {
        const latestMetric = await DailyMetrics.findOne({ userId: user._id }).sort({ date: -1 });
        console.log(`  Latest data: ${latestMetric.date.toISOString().split('T')[0]}`);
      }
    } else {
      console.log('❌ User not found!');
      console.log('\nLet me check all users in database:');
      const allUsers = await User.find({});
      console.log(`Total users: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (ID: ${u._id})`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
