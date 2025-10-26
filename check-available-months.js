require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function checkAvailableMonths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    console.log('=' .repeat(70));

    // Get user ID
    const User = require('./models/User');
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`\nChecking data for user: ${user.email}`);
    console.log('User ID:', user._id);
    console.log('\n' + '=' .repeat(70));

    // Check data availability by month
    const months = [
      { name: 'June 2025', start: new Date('2025-06-01'), end: new Date('2025-06-30') },
      { name: 'July 2025', start: new Date('2025-07-01'), end: new Date('2025-07-31') },
      { name: 'August 2025', start: new Date('2025-08-01'), end: new Date('2025-08-31') },
      { name: 'September 2025', start: new Date('2025-09-01'), end: new Date('2025-09-30') },
      { name: 'October 2025', start: new Date('2025-10-01'), end: new Date('2025-10-31') }
    ];

    console.log('\n📊 DATA AVAILABILITY BY MONTH:\n');

    for (const month of months) {
      const metrics = await DailyMetrics.find({
        userId: user._id,
        date: {
          $gte: month.start,
          $lte: month.end
        }
      }).sort({ date: 1 });

      if (metrics.length > 0) {
        const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
        const totalOrders = metrics.reduce((sum, m) => sum + (m.totalOrders || 0), 0);
        const totalProfit = metrics.reduce((sum, m) => sum + (m.netProfit || 0), 0);

        console.log(`✅ ${month.name}:`);
        console.log(`   Days with data: ${metrics.length}`);
        console.log(`   Total Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
        console.log(`   Total Orders: ${totalOrders}`);
        console.log(`   Total Profit: ₹${Math.round(totalProfit).toLocaleString('en-IN')}`);
        console.log(`   Date range: ${metrics[0].date.toISOString().split('T')[0]} to ${metrics[metrics.length-1].date.toISOString().split('T')[0]}\n`);
      } else {
        console.log(`❌ ${month.name}: No data found\n`);
      }
    }

    console.log('=' .repeat(70));
    console.log('\n📅 SUMMARY:\n');

    const allMetrics = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: new Date('2025-06-01'),
        $lte: new Date('2025-10-31')
      }
    }).sort({ date: 1 });

    if (allMetrics.length > 0) {
      console.log(`Total days with data: ${allMetrics.length}`);
      console.log(`First date: ${allMetrics[0].date.toISOString().split('T')[0]}`);
      console.log(`Last date: ${allMetrics[allMetrics.length-1].date.toISOString().split('T')[0]}`);
      
      const totalRevenue = allMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
      const totalOrders = allMetrics.reduce((sum, m) => sum + (m.totalOrders || 0), 0);
      
      console.log(`\nTotal Revenue (Jun-Oct): ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
      console.log(`Total Orders (Jun-Oct): ${totalOrders}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Check complete\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAvailableMonths();
