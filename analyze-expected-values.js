const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

async function analyzeExpectedValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    const allMetrics = await DailyMetrics.find({ userId: user._id });
    
    const totals = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      cogs: acc.cogs + (m.cogs || 0),
      shippingCost: acc.shippingCost + (m.shippingCost || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, cogs: 0, shippingCost: 0, netProfit: 0, orders: 0 });
    
    console.log('=== CURRENT DATABASE VALUES ===');
    console.log(`Revenue: ₹${totals.revenue.toFixed(2)}`);
    console.log(`COGS: ₹${totals.cogs.toFixed(2)} (${(totals.cogs/totals.revenue*100).toFixed(1)}% of revenue)`);
    console.log(`Ad Spend: ₹${totals.adSpend.toFixed(2)}`);
    console.log(`Shipping Cost: ₹${totals.shippingCost.toFixed(2)}`);
    console.log(`Gross Profit: ₹${(totals.revenue - totals.cogs).toFixed(2)}`);
    console.log(`Net Profit: ₹${totals.netProfit.toFixed(2)}`);
    console.log(`Orders: ${totals.orders}`);
    console.log(`ROAS: ${(totals.revenue / totals.adSpend).toFixed(2)}`);
    console.log(`POAS: ${(totals.netProfit / totals.adSpend).toFixed(2)}`);
    
    console.log('\n=== EXPECTED VALUES ===');
    const EXPECTED_ROAS = 8.26;
    const EXPECTED_POAS = 7.75;
    const EXPECTED_AD_SPEND = 640139;
    
    console.log(`ROAS: ${EXPECTED_ROAS}`);
    console.log(`POAS: ${EXPECTED_POAS}`);
    console.log(`Ad Spend: ₹${EXPECTED_AD_SPEND}`);
    
    // Calculate what revenue and net profit should be
    const expectedRevenue = EXPECTED_AD_SPEND * EXPECTED_ROAS;
    const expectedNetProfit = EXPECTED_AD_SPEND * EXPECTED_POAS;
    
    console.log(`\nDerived from expected ROAS/POAS:`);
    console.log(`Expected Revenue: ₹${expectedRevenue.toFixed(2)}`);
    console.log(`Expected Net Profit: ₹${expectedNetProfit.toFixed(2)}`);
    
    // Calculate what COGS should be
    const expectedGrossProfit = expectedNetProfit + EXPECTED_AD_SPEND + totals.shippingCost;
    const expectedCOGS = expectedRevenue - expectedGrossProfit;
    
    console.log(`Expected Gross Profit: ₹${expectedGrossProfit.toFixed(2)}`);
    console.log(`Expected COGS: ₹${expectedCOGS.toFixed(2)} (${(expectedCOGS/expectedRevenue*100).toFixed(1)}% of revenue)`);
    
    console.log('\n=== ANALYSIS ===');
    console.log(`Revenue difference: ₹${(totals.revenue - expectedRevenue).toFixed(2)}`);
    console.log(`  Current: ₹${totals.revenue.toFixed(2)}`);
    console.log(`  Expected: ₹${expectedRevenue.toFixed(2)}`);
    console.log(`  Ratio: ${(totals.revenue / expectedRevenue).toFixed(3)}`);
    
    console.log(`\nCOGS difference: ₹${(totals.cogs - expectedCOGS).toFixed(2)}`);
    console.log(`  Current: ₹${totals.cogs.toFixed(2)} (${(totals.cogs/totals.revenue*100).toFixed(1)}% of revenue)`);
    console.log(`  Expected: ₹${expectedCOGS.toFixed(2)} (${(expectedCOGS/expectedRevenue*100).toFixed(1)}% of revenue)`);
    
    console.log(`\nNet Profit difference: ₹${(totals.netProfit - expectedNetProfit).toFixed(2)}`);
    console.log(`  Current: ₹${totals.netProfit.toFixed(2)}`);
    console.log(`  Expected: ₹${expectedNetProfit.toFixed(2)}`);
    
    console.log('\n=== POSSIBLE SOLUTIONS ===');
    console.log('1. Adjust COGS formula from 50% to ' + (expectedCOGS/expectedRevenue*100).toFixed(1) + '% of revenue');
    console.log('2. Filter data to match the expected date range');
    console.log('3. Verify if expected values are for a subset of data');
    
    // Check if there's a subset that matches
    console.log('\n=== CHECKING FOR MATCHING SUBSET ===');
    const targetRatio = expectedRevenue / totals.revenue;
    console.log(`Need to reduce revenue to ${(targetRatio * 100).toFixed(1)}% of current`);
    
    // Try to find a date range that matches
    const sortedMetrics = allMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    let bestMatch = { diff: Infinity, start: 0, end: 0, roas: 0, poas: 0 };
    
    for (let i = 0; i < sortedMetrics.length; i++) {
      let subRevenue = 0;
      let subAdSpend = 0;
      let subNetProfit = 0;
      
      for (let j = i; j < sortedMetrics.length; j++) {
        subRevenue += sortedMetrics[j].revenue || 0;
        subAdSpend += sortedMetrics[j].adSpend || 0;
        subNetProfit += sortedMetrics[j].netProfit || 0;
        
        if (Math.abs(subAdSpend - EXPECTED_AD_SPEND) < 10000) {
          const subROAS = subAdSpend > 0 ? subRevenue / subAdSpend : 0;
          const subPOAS = subAdSpend > 0 ? subNetProfit / subAdSpend : 0;
          const diff = Math.abs(subROAS - EXPECTED_ROAS) + Math.abs(subPOAS - EXPECTED_POAS);
          
          if (diff < bestMatch.diff) {
            bestMatch = {
              diff,
              start: i,
              end: j,
              roas: subROAS,
              poas: subPOAS,
              revenue: subRevenue,
              adSpend: subAdSpend,
              netProfit: subNetProfit
            };
          }
        }
      }
    }
    
    if (bestMatch.diff < Infinity) {
      console.log(`\nBest matching subset found:`);
      console.log(`  Date range: ${sortedMetrics[bestMatch.start].date.toISOString().split('T')[0]} to ${sortedMetrics[bestMatch.end].date.toISOString().split('T')[0]}`);
      console.log(`  Days: ${bestMatch.end - bestMatch.start + 1}`);
      console.log(`  Revenue: ₹${bestMatch.revenue.toFixed(2)}`);
      console.log(`  Ad Spend: ₹${bestMatch.adSpend.toFixed(2)}`);
      console.log(`  Net Profit: ₹${bestMatch.netProfit.toFixed(2)}`);
      console.log(`  ROAS: ${bestMatch.roas.toFixed(2)} (Expected: ${EXPECTED_ROAS})`);
      console.log(`  POAS: ${bestMatch.poas.toFixed(2)} (Expected: ${EXPECTED_POAS})`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

analyzeExpectedValues();
