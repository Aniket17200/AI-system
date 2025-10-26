const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

async function testDashboardAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== USER INFO ===');
    console.log(`User ID: ${user._id}`);
    console.log(`Email: ${user.email}`);

    // Get all metrics for this user
    const allMetrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    
    console.log('\n=== DATABASE METRICS ===');
    console.log(`Total records: ${allMetrics.length}`);
    
    if (allMetrics.length === 0) {
      console.log('❌ No metrics found in database!');
      return;
    }

    const firstDate = allMetrics[0].date;
    const lastDate = allMetrics[allMetrics.length - 1].date;
    
    console.log(`Date range: ${firstDate.toISOString().split('T')[0]} to ${lastDate.toISOString().split('T')[0]}`);

    // Calculate totals
    const totals = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      cogs: acc.cogs + (m.cogs || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, cogs: 0, adSpend: 0, netProfit: 0, orders: 0 });

    console.log('\n=== TOTALS FROM DATABASE ===');
    console.log(`Total Orders: ${totals.orders}`);
    console.log(`Total Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`Total COGS: ₹${totals.cogs.toFixed(2)}`);
    console.log(`Total Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`Total Net Profit: ₹${totals.netProfit.toFixed(2)}`);
    console.log(`ROAS: ${(totals.revenue / totals.adSpend).toFixed(2)}`);
    console.log(`POAS: ${(totals.netProfit / totals.adSpend).toFixed(2)}`);

    // Test dashboard query
    console.log('\n=== TESTING DASHBOARD QUERY ===');
    const startDate = new Date(firstDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(lastDate);
    endDate.setHours(23, 59, 59, 999);

    console.log(`Query: userId=${user._id}, startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`);

    const queryResult = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    console.log(`Query returned: ${queryResult.length} records`);

    if (queryResult.length === 0) {
      console.log('❌ Query returned no results!');
      console.log('This means the dashboard API will return empty data.');
    } else {
      console.log('✓ Query successful');
      
      // Show sample records
      console.log('\nSample records (first 3):');
      queryResult.slice(0, 3).forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]}: Orders=${m.totalOrders}, Revenue=₹${m.revenue.toFixed(2)}, COGS=₹${m.cogs.toFixed(2)}, AdSpend=₹${m.adSpend.toFixed(2)}`);
      });
    }

    // Test API endpoint format
    console.log('\n=== API ENDPOINT TEST ===');
    console.log('To test the dashboard API, use:');
    console.log(`GET http://localhost:6000/api/data/dashboard?startDate=${firstDate.toISOString().split('T')[0]}&endDate=${lastDate.toISOString().split('T')[0]}&userId=${user._id}`);
    console.log('\nOr with Authorization header:');
    console.log(`GET http://localhost:6000/api/data/dashboard?startDate=${firstDate.toISOString().split('T')[0]}&endDate=${lastDate.toISOString().split('T')[0]}`);
    console.log(`Authorization: Bearer <your-jwt-token>`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDashboardAPI();
