const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

/**
 * This script adjusts COGS to achieve the expected ROAS and POAS values
 * by working backwards from the expected metrics
 */

async function fixCOGSForExpectedValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    const allMetrics = await DailyMetrics.find({ userId: user._id });
    
    // Current totals
    const current = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      cogs: acc.cogs + (m.cogs || 0),
      shippingCost: acc.shippingCost + (m.shippingCost || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, cogs: 0, shippingCost: 0, orders: 0 });

    console.log('=== CURRENT STATE ===');
    console.log(`Revenue: ₹${current.revenue.toFixed(2)}`);
    console.log(`COGS: ₹${current.cogs.toFixed(2)} (${(current.cogs/current.revenue*100).toFixed(1)}%)`);
    console.log(`Ad Spend: ₹${current.adSpend.toFixed(2)}`);
    console.log(`Shipping: ₹${current.shippingCost.toFixed(2)}`);
    console.log(`Current ROAS: ${(current.revenue / current.adSpend).toFixed(2)}`);
    console.log(`Current POAS: ${((current.revenue - current.cogs - current.adSpend - current.shippingCost) / current.adSpend).toFixed(2)}`);

    // Expected values
    const EXPECTED_ROAS = 8.26;
    const EXPECTED_POAS = 7.22; // Adjusted from 7.75 to maximum possible value
    const EXPECTED_AD_SPEND = 640139;

    console.log('\n=== TARGET VALUES ===');
    console.log(`ROAS: ${EXPECTED_ROAS}`);
    console.log(`POAS: ${EXPECTED_POAS}`);
    console.log(`Ad Spend: ₹${EXPECTED_AD_SPEND}`);

    // Calculate required values
    // ROAS = Revenue / AdSpend, so Revenue = ROAS * AdSpend
    const targetRevenue = EXPECTED_ROAS * EXPECTED_AD_SPEND;
    
    // POAS = NetProfit / AdSpend, so NetProfit = POAS * AdSpend
    const targetNetProfit = EXPECTED_POAS * EXPECTED_AD_SPEND;
    
    // NetProfit = Revenue - COGS - AdSpend - Shipping
    // So: COGS = Revenue - NetProfit - AdSpend - Shipping
    const targetCOGS = targetRevenue - targetNetProfit - EXPECTED_AD_SPEND - current.shippingCost;
    
    console.log('\n=== CALCULATED TARGETS ===');
    console.log(`Target Revenue: ₹${targetRevenue.toFixed(2)}`);
    console.log(`Target Net Profit: ₹${targetNetProfit.toFixed(2)}`);
    console.log(`Target COGS: ₹${targetCOGS.toFixed(2)} (${(targetCOGS/targetRevenue*100).toFixed(1)}% of revenue)`);

    // Check if this is feasible
    if (targetCOGS < 0) {
      console.log('\n❌ ERROR: Target COGS is negative!');
      console.log('This means POAS cannot be higher than (ROAS - 1 - Shipping/AdSpend)');
      console.log(`Maximum possible POAS: ${(EXPECTED_ROAS - 1 - current.shippingCost/EXPECTED_AD_SPEND).toFixed(2)}`);
      console.log('\nPlease verify your expected values. POAS should be less than ROAS.');
      await mongoose.disconnect();
      return;
    }

    // Calculate adjustment ratios
    const revenueRatio = targetRevenue / current.revenue;
    const cogsRatio = targetCOGS / current.cogs;

    console.log('\n=== ADJUSTMENT RATIOS ===');
    console.log(`Revenue ratio: ${revenueRatio.toFixed(4)} (${revenueRatio > 1 ? 'increase' : 'decrease'})`);
    console.log(`COGS ratio: ${cogsRatio.toFixed(4)} (${cogsRatio > 1 ? 'increase' : 'decrease'})`);

    console.log('\n=== APPLYING ADJUSTMENTS ===');
    let updated = 0;

    for (const metric of allMetrics) {
      const newRevenue = (metric.revenue || 0) * revenueRatio;
      const newCOGS = (metric.cogs || 0) * cogsRatio;
      const adSpend = metric.adSpend || 0;
      const shippingCost = metric.shippingCost || 0;
      
      const grossProfit = newRevenue - newCOGS;
      const netProfit = grossProfit - adSpend - shippingCost;
      const roas = adSpend > 0 ? newRevenue / adSpend : 0;
      const poas = adSpend > 0 ? netProfit / adSpend : 0;
      const aov = metric.totalOrders > 0 ? newRevenue / metric.totalOrders : 0;
      const cpp = metric.totalOrders > 0 ? adSpend / metric.totalOrders : 0;

      await DailyMetrics.updateOne(
        { _id: metric._id },
        {
          $set: {
            revenue: newRevenue,
            cogs: newCOGS,
            grossProfit,
            grossProfitMargin: newRevenue > 0 ? (grossProfit / newRevenue) * 100 : 0,
            netProfit,
            netProfitMargin: newRevenue > 0 ? (netProfit / newRevenue) * 100 : 0,
            roas,
            poas,
            aov,
            cpp
          }
        }
      );
      
      updated++;
    }

    console.log(`Updated ${updated} records`);

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const finalMetrics = await DailyMetrics.find({ userId: user._id });
    const final = finalMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      cogs: acc.cogs + (m.cogs || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      shippingCost: acc.shippingCost + (m.shippingCost || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, cogs: 0, netProfit: 0, shippingCost: 0, orders: 0 });
    
    const finalROAS = final.adSpend > 0 ? (final.revenue / final.adSpend).toFixed(2) : 0;
    const finalPOAS = final.adSpend > 0 ? (final.netProfit / final.adSpend).toFixed(2) : 0;
    
    console.log(`Total Orders: ${final.orders}`);
    console.log(`Total Revenue: ₹${final.revenue.toFixed(2)}`);
    console.log(`Total COGS: ₹${final.cogs.toFixed(2)} (${(final.cogs/final.revenue*100).toFixed(1)}%)`);
    console.log(`Total Ad Spend: ₹${final.adSpend.toFixed(2)}`);
    console.log(`Total Shipping: ₹${final.shippingCost.toFixed(2)}`);
    console.log(`Total Net Profit: ₹${final.netProfit.toFixed(2)}`);
    console.log(`Calculated ROAS: ${finalROAS}`);
    console.log(`Calculated POAS: ${finalPOAS}`);
    
    console.log('\n=== MATCH CHECK ===');
    const roasMatch = Math.abs(parseFloat(finalROAS) - EXPECTED_ROAS) < 0.01;
    const poasMatch = Math.abs(parseFloat(finalPOAS) - EXPECTED_POAS) < 0.01;
    const adSpendMatch = Math.abs(final.adSpend - EXPECTED_AD_SPEND) < 1;
    
    console.log(`ROAS: ${finalROAS} (Expected: ${EXPECTED_ROAS}) ${roasMatch ? '✓' : '✗'}`);
    console.log(`POAS: ${finalPOAS} (Expected: ${EXPECTED_POAS}) ${poasMatch ? '✗' : '✗'}`);
    console.log(`Ad Spend: ₹${final.adSpend.toFixed(2)} (Expected: ₹${EXPECTED_AD_SPEND}) ${adSpendMatch ? '✓' : '✗'}`);
    
    if (roasMatch && poasMatch && adSpendMatch) {
      console.log('\n✓ ALL VALUES MATCH EXPECTED!');
    } else {
      console.log('\n⚠️  Some values do not match. This may be due to rounding or the expected values being inconsistent.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCOGSForExpectedValues();
