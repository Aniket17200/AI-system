require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');

async function addSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log(`Adding sample data for user: ${user.email}`);
    console.log(`User ID: ${user._id}\n`);

    // Delete existing data
    await DailyMetrics.deleteMany({ userId: user._id });
    console.log('Cleared existing data');

    // Add 90 days of sample data
    const metrics = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const baseRevenue = 50000 + Math.random() * 30000;
      const orders = Math.floor(80 + Math.random() * 40);
      const adSpend = 3000 + Math.random() * 2000;
      const shippingCost = 800 + Math.random() * 400;

      metrics.push({
        userId: user._id,
        date,
        revenue: Math.round(baseRevenue),
        orders,
        adSpend: Math.round(adSpend),
        roas: Math.round((baseRevenue / adSpend) * 100) / 100,
        shippingCost: Math.round(shippingCost),
        cogs: Math.round(baseRevenue * 0.35),
        profit: Math.round(baseRevenue - adSpend - shippingCost - (baseRevenue * 0.35)),
        delivered: Math.floor(orders * 0.85),
        inTransit: Math.floor(orders * 0.10),
        rto: Math.floor(orders * 0.05)
      });
    }

    await DailyMetrics.insertMany(metrics);
    console.log(`✓ Added ${metrics.length} days of sample data`);

    // Show summary
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalOrders = metrics.reduce((sum, m) => sum + m.orders, 0);
    const totalAdSpend = metrics.reduce((sum, m) => sum + m.adSpend, 0);
    const avgRoas = totalRevenue / totalAdSpend;

    console.log('\nData Summary:');
    console.log(`  Total Revenue: ₹${totalRevenue.toLocaleString()}`);
    console.log(`  Total Orders: ${totalOrders}`);
    console.log(`  Total Ad Spend: ₹${totalAdSpend.toLocaleString()}`);
    console.log(`  Average ROAS: ${avgRoas.toFixed(2)}x`);
    console.log(`  Date Range: ${metrics[0].date.toISOString().split('T')[0]} to ${metrics[metrics.length-1].date.toISOString().split('T')[0]}`);

    await mongoose.connection.close();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addSampleData();
