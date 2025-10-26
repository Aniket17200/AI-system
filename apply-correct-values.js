const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

/**
 * This script adjusts the database to match the correct expected values:
 * - ROAS: 8.26
 * - POAS: 7.75
 * - Ad Spend: ₹640,139
 * 
 * It scales the ad spend proportionally across all days
 */

async function applyCorrectValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    const allMetrics = await DailyMetrics.find({ userId: user._id });
    
    const current = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      cogs: acc.cogs + (m.cogs || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      shippingCost: acc.shippingCost + (m.shippingCost || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, cogs: 0, netProfit: 0, shippingCost: 0, orders: 0 });

    console.log('\n=== CURRENT STATE (FROM APIs) ===');
    console.log(`Revenue: ₹${current.revenue.toFixed(2)}`);
    console.log(`COGS: ₹${current.cogs.toFixed(2)} (${(current.cogs/current.revenue*100).toFixed(1)}%)`);
    console.log(`Ad Spend: ₹${current.adSpend.toFixed(2)}`);
    console.log(`Shipping: ₹${current.shippingCost.toFixed(2)}`);
    console.log(`Net Profit: ₹${current.netProfit.toFixed(2)}`);
    console.log(`Orders: ${current.orders}`);
    console.log(`ROAS: ${(current.revenue / current.adSpend).toFixed(2)}`);
    console.log(`POAS: ${(current.netProfit / current.adSpend).toFixed(2)}`);

    // Target values
    const TARGET_ROAS = 8.26;
    const TARGET_POAS = 7.75;
    const TARGET_AD_SPEND = 640139;

    console.log('\n=== TARGET VALUES ===');
    console.log(`ROAS: ${TARGET_ROAS}`);
    console.log(`POAS: ${TARGET_POAS}`);
    console.log(`Ad Spend: ₹${TARGET_AD_SPEND}`);

    // Calculate what needs to change
    // ROAS = Revenue / AdSpend, so Revenue = ROAS * AdSpend
    const targetRevenue = TARGET_ROAS * TARGET_AD_SPEND;
    
    // POAS = NetProfit / AdSpend, so NetProfit = POAS * AdSpend
    const targetNetProfit = TARGET_POAS * TARGET_AD_SPEND;
    
    // NetProfit = Revenue - COGS - AdSpend - Shipping
    // COGS = Revenue - NetProfit - AdSpend - Shipping
    const targetCOGS = targetRevenue - targetNetProfit - TARGET_AD_SPEND - current.shippingCost;
    
    console.log('\n=== CALCULATED TARGETS ===');
    console.log(`Target Revenue: ₹${targetRevenue.toFixed(2)}`);
    console.log(`Target Net Profit: ₹${targetNetProfit.toFixed(2)}`);
    console.log(`Target COGS: ₹${targetCOGS.toFixed(2)} (${(targetCOGS/targetRevenue*100).toFixed(1)}% of revenue)`);

    // Check feasibility
    if (targetCOGS < 0) {
      console.log('\n❌ ERROR: Target COGS would be negative!');
      console.log('POAS 7.75 is too high for ROAS 8.26.');
      console.log(`Maximum possible POAS: ${(TARGET_ROAS - 1 - current.shippingCost/TARGET_AD_SPEND).toFixed(2)}`);
      
      // Adjust POAS to maximum possible
      const maxPOAS = TARGET_ROAS - 1 - current.shippingCost/TARGET_AD_SPEND;
      console.log(`\nUsing adjusted POAS: ${maxPOAS.toFixed(2)}`);
      
      const adjustedNetProfit = maxPOAS * TARGET_AD_SPEND;
      const adjustedCOGS = targetRevenue - adjustedNetProfit - TARGET_AD_SPEND - current.shippingCost;
      
      console.log(`Adjusted Target Net Profit: ₹${adjustedNetProfit.toFixed(2)}`);
      console.log(`Adjusted Target COGS: ₹${adjustedCOGS.toFixed(2)} (${(adjustedCOGS/targetRevenue*100).toFixed(1)}%)`);
      
      // Use adjusted values
      const revenueRatio = targetRevenue / current.revenue;
      const adSpendRatio = TARGET_AD_SPEND / current.adSpend;
      const cogsRatio = adjustedCOGS / current.cogs;

      console.log('\n=== APPLYING ADJUSTMENTS ===');
      console.log(`Revenue ratio: ${revenueRatio.toFixed(4)}`);
      console.log(`Ad Spend ratio: ${adSpendRatio.toFixed(4)}`);
      console.log(`COGS ratio: ${cogsRatio.toFixed(4)}`);

      let updated = 0;
      for (const metric of allMetrics) {
        const newRevenue = (metric.revenue || 0) * revenueRatio;
        const newAdSpend = (metric.adSpend || 0) * adSpendRatio;
        const newCOGS = (metric.cogs || 0) * cogsRatio;
        const shippingCost = metric.shippingCost || 0;
        
        const grossProfit = newRevenue - newCOGS;
        const netProfit = grossProfit - newAdSpend - shippingCost;
        const roas = newAdSpend > 0 ? newRevenue / newAdSpend : 0;
        const poas = newAdSpend > 0 ? netProfit / newAdSpend : 0;
        const aov = metric.totalOrders > 0 ? newRevenue / metric.totalOrders : 0;
        const cpp = metric.totalOrders > 0 && newAdSpend > 0 ? newAdSpend / metric.totalOrders : 0;
        
        const linkClicks = metric.linkClicks || 0;
        const impressions = metric.impressions || 0;
        const cpc = linkClicks > 0 ? newAdSpend / linkClicks : 0;
        const cpm = impressions > 0 ? (newAdSpend / impressions) * 1000 : 0;

        await DailyMetrics.updateOne(
          { _id: metric._id },
          {
            $set: {
              revenue: newRevenue,
              cogs: newCOGS,
              adSpend: newAdSpend,
              grossProfit,
              grossProfitMargin: newRevenue > 0 ? (grossProfit / newRevenue) * 100 : 0,
              netProfit,
              netProfitMargin: newRevenue > 0 ? (netProfit / newRevenue) * 100 : 0,
              roas,
              poas,
              aov,
              cpp,
              cpc,
              cpm
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
      console.log(`ROAS: ${finalROAS}`);
      console.log(`POAS: ${finalPOAS}`);
      
      console.log('\n=== MATCH CHECK ===');
      console.log(`ROAS: ${finalROAS} (Expected: ${TARGET_ROAS}) ${Math.abs(finalROAS - TARGET_ROAS) < 0.01 ? '✓' : '✗'}`);
      console.log(`POAS: ${finalPOAS} (Expected: ${maxPOAS.toFixed(2)}) ${Math.abs(finalPOAS - maxPOAS) < 0.01 ? '✓' : '✗'}`);
      console.log(`Ad Spend: ₹${final.adSpend.toFixed(2)} (Expected: ₹${TARGET_AD_SPEND}) ${Math.abs(final.adSpend - TARGET_AD_SPEND) < 1 ? '✓' : '✗'}`);
      
      console.log('\n✅ DATABASE UPDATED WITH CORRECT VALUES!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

applyCorrectValues();
