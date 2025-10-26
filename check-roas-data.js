require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function checkROASData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    console.log('=' .repeat(70));

    const User = require('./models/User');
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    console.log('\n📊 ROAS DATA ANALYSIS:\n');

    const months = [
      { name: 'August 2025', start: new Date('2025-08-01'), end: new Date('2025-08-31') },
      { name: 'September 2025', start: new Date('2025-09-01'), end: new Date('2025-09-30') },
      { name: 'October 2025', start: new Date('2025-10-01'), end: new Date('2025-10-25') }
    ];

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
        const totalAdSpend = metrics.reduce((sum, m) => sum + (m.adSpend || 0), 0);
        const totalOrders = metrics.reduce((sum, m) => sum + (m.totalOrders || 0), 0);
        const totalProfit = metrics.reduce((sum, m) => sum + (m.netProfit || 0), 0);
        
        const avgROAS = metrics.filter(m => m.roas > 0).reduce((sum, m) => sum + m.roas, 0) / 
                        metrics.filter(m => m.roas > 0).length;
        const calculatedROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        console.log(`${month.name}:`);
        console.log(`  Days: ${metrics.length}`);
        console.log(`  Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
        console.log(`  Ad Spend: ₹${Math.round(totalAdSpend).toLocaleString('en-IN')}`);
        console.log(`  Orders: ${totalOrders}`);
        console.log(`  Profit: ₹${Math.round(totalProfit).toLocaleString('en-IN')}`);
        console.log(`  Avg ROAS (from DB): ${avgROAS.toFixed(2)}x`);
        console.log(`  Calculated ROAS: ${calculatedROAS.toFixed(2)}x`);
        console.log(`  Profit Margin: ${profitMargin.toFixed(1)}%\n`);
      }
    }

    console.log('=' .repeat(70));
    console.log('\n📈 TREND ANALYSIS:\n');

    const allMetrics = await DailyMetrics.find({
      userId: user._id,
      date: {
        $gte: new Date('2025-08-01'),
        $lte: new Date('2025-10-25')
      }
    }).sort({ date: 1 });

    const totalRevenue = allMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
    const totalAdSpend = allMetrics.reduce((sum, m) => sum + (m.adSpend || 0), 0);
    const totalOrders = allMetrics.reduce((sum, m) => sum + (m.totalOrders || 0), 0);
    const totalProfit = allMetrics.reduce((sum, m) => sum + (m.netProfit || 0), 0);

    const overallROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
    const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgDailyRevenue = totalRevenue / allMetrics.length;
    const avgDailyOrders = totalOrders / allMetrics.length;

    console.log('Overall (Aug-Oct 2025):');
    console.log(`  Total Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
    console.log(`  Total Ad Spend: ₹${Math.round(totalAdSpend).toLocaleString('en-IN')}`);
    console.log(`  Total Orders: ${totalOrders}`);
    console.log(`  Total Profit: ₹${Math.round(totalProfit).toLocaleString('en-IN')}`);
    console.log(`  Overall ROAS: ${overallROAS.toFixed(2)}x`);
    console.log(`  Overall Profit Margin: ${overallProfitMargin.toFixed(1)}%`);
    console.log(`  Avg Daily Revenue: ₹${Math.round(avgDailyRevenue).toLocaleString('en-IN')}`);
    console.log(`  Avg Daily Orders: ${Math.round(avgDailyOrders)}`);

    console.log('\n' + '=' .repeat(70));
    console.log('\n🎯 PREDICTION INPUTS FOR AI:\n');
    console.log('When OpenAI is enabled, it will use:');
    console.log(`  • Historical ROAS: ${overallROAS.toFixed(2)}x`);
    console.log(`  • Historical Profit Margin: ${overallProfitMargin.toFixed(1)}%`);
    console.log(`  • Revenue Growth Trend: Calculate from month-to-month`);
    console.log(`  • Ad Spend Efficiency: ${(totalRevenue / totalAdSpend).toFixed(2)}x`);
    console.log(`  • Order Conversion Trends: ${(totalOrders / allMetrics.length).toFixed(0)} orders/day`);

    console.log('\n✅ This data will be used to predict realistic ROAS for Nov-Jan\n');

    await mongoose.disconnect();

  } catch (error) {
    console.error('Error:', error);
  }
}

checkROASData();
