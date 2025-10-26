require('dotenv').config();
const mongoose = require('mongoose');

async function checkAllShippingData() {
  try {
    console.log('🔍 Checking All Shipping Data in Database\n');

    await mongoose.connect(process.env.MONGODB_URI);
    
    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    const allMetrics = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: new Date('2025-07-27'),
        $lte: new Date('2025-10-25')
      }
    }).sort({ date: 1 });

    console.log(`Total days: ${allMetrics.length}\n`);

    const withShipping = allMetrics.filter(m => m.shippingCost > 0);
    const withoutShipping = allMetrics.filter(m => !m.shippingCost || m.shippingCost === 0);

    console.log(`Days WITH shipping cost: ${withShipping.length}`);
    console.log(`Days WITHOUT shipping cost: ${withoutShipping.length}\n`);

    if (withoutShipping.length > 0) {
      console.log('Days missing shipping cost:');
      withoutShipping.forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]} - Orders: ${m.totalOrders}, Revenue: ₹${m.revenue.toLocaleString('en-IN')}`);
      });
    }

    const totalShipping = withShipping.reduce((sum, m) => sum + m.shippingCost, 0);
    console.log(`\nTotal shipping cost: ₹${totalShipping.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);

    // Check if we need to add shipping data to more days
    const needsShipping = withoutShipping.filter(m => m.totalOrders > 0);
    if (needsShipping.length > 0) {
      console.log(`\n⚠️  ${needsShipping.length} days have orders but no shipping cost`);
      console.log('   Run add-shipping-data-2025.js to fix this');
    } else {
      console.log('\n✅ All days with orders have shipping cost!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkAllShippingData();
