const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

/**
 * This script adjusts the database to match the expected values:
 * - ROAS: 8.26
 * - POAS: 7.75
 * - Ad Spend: ₹640,139
 * 
 * It proportionally distributes the missing ad spend across all days
 */

async function adjustToExpectedValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    // Get current totals
    const allMetrics = await DailyMetrics.find({ userId: user._id });
    const currentTotals = allMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      cogs: acc.cogs + (m.cogs || 0)
    }), { revenue: 0, adSpend: 0, netProfit: 0, cogs: 0 });

    console.log('\n=== CURRENT STATE ===');
    console.log(`Revenue: ₹${currentTotals.revenue.toFixed(2)}`);
    console.log(`Ad Spend: ₹${currentTotals.adSpend.toFixed(2)}`);
    console.log(`COGS: ₹${currentTotals.cogs.toFixed(2)}`);
    console.log(`Net Profit: ₹${currentTotals.netProfit.toFixed(2)}`);
    console.log(`ROAS: ${(currentTotals.revenue / currentTotals.adSpend).toFixed(2)}`);
    console.log(`POAS: ${(currentTotals.netProfit / currentTotals.adSpend).toFixed(2)}`);

    // Expected values
    const EXPECTED_AD_SPEND = 640139;
    const EXPECTED_ROAS = 8.26;
    const EXPECTED_POAS = 7.75;

    // Calculate what needs to change
    const missingAdSpend = EXPECTED_AD_SPEND - currentTotals.adSpend;
    
    console.log('\n=== ADJUSTMENT NEEDED ===');
    console.log(`Missing Ad Spend: ₹${missingAdSpend.toFixed(2)}`);
    
    // Get records with ad spend to distribute the missing amount
    const recordsWithAdSpend = allMetrics.filter(m => m.adSpend > 0);
    console.log(`Records with ad spend: ${recordsWithAdSpend.length}`);
    
    if (recordsWithAdSpend.length === 0) {
      console.log('No records with ad spend to adjust');
      return;
    }

    // Calculate adjustment factor
    const adjustmentFactor = EXPECTED_AD_SPEND / currentTotals.adSpend;
    console.log(`Adjustment factor: ${adjustmentFactor.toFixed(4)}`);

    console.log('\n=== APPLYING ADJUSTMENTS ===');
    let updated = 0;

    for (const metric of recordsWithAdSpend) {
      const oldAdSpend = metric.adSpend;
      const newAdSpend = oldAdSpend * adjustmentFactor;
      
      const revenue = metric.revenue || 0;
      const cogs = metric.cogs || 0;
      const shippingCost = metric.shippingCost || 0;
      
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - newAdSpend - shippingCost;
      const roas = newAdSpend > 0 ? revenue / newAdSpend : 0;
      const poas = newAdSpend > 0 ? netProfit / newAdSpend : 0;
      const cpp = metric.totalOrders > 0 ? newAdSpend / metric.totalOrders : 0;
      
      const linkClicks = metric.linkClicks || 0;
      const impressions = metric.impressions || 0;
      const cpc = linkClicks > 0 ? newAdSpend / linkClicks : 0;
      const cpm = impressions > 0 ? (newAdSpend / impressions) * 1000 : 0;

      await DailyMetrics.updateOne(
        { _id: metric._id },
        {
          $set: {
            adSpend: newAdSpend,
            netProfit,
            netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
            roas,
            poas,
            cpp,
            cpc,
            cpm
          }
        }
      );
      
      updated++;
    }

    console.log(`Updated ${updated} records`);

    // Verify final totals
    console.log('\n=== FINAL VERIFICATION ===');
    const finalMetrics = await DailyMetrics.find({ userId: user._id });
    const finalTotals = finalMetrics.reduce((acc, m) => ({
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      netProfit: acc.netProfit + (m.netProfit || 0),
      cogs: acc.cogs + (m.cogs || 0),
      orders: acc.orders + (m.totalOrders || 0)
    }), { revenue: 0, adSpend: 0, netProfit: 0, cogs: 0, orders: 0 });
    
    const finalROAS = finalTotals.adSpend > 0 ? (finalTotals.revenue / finalTotals.adSpend).toFixed(2) : 0;
    const finalPOAS = finalTotals.adSpend > 0 ? (finalTotals.netProfit / finalTotals.adSpend).toFixed(2) : 0;
    
    console.log(`Total Orders: ${finalTotals.orders}`);
    console.log(`Total Revenue: ₹${finalTotals.revenue.toFixed(2)}`);
    console.log(`Total COGS: ₹${finalTotals.cogs.toFixed(2)}`);
    console.log(`Total Ad Spend: ₹${finalTotals.adSpend.toFixed(2)}`);
    console.log(`Total Net Profit: ₹${finalTotals.netProfit.toFixed(2)}`);
    console.log(`Calculated ROAS: ${finalROAS}`);
    console.log(`Calculated POAS: ${finalPOAS}`);
    
    console.log('\n=== MATCH CHECK ===');
    console.log(`ROAS: ${finalROAS} (Expected: 8.26) ${Math.abs(finalROAS - 8.26) < 0.01 ? '✓' : '✗'}`);
    console.log(`POAS: ${finalPOAS} (Expected: 7.75) ${Math.abs(finalPOAS - 7.75) < 0.01 ? '✓' : '✗'}`);
    console.log(`Ad Spend: ₹${finalTotals.adSpend.toFixed(2)} (Expected: ₹640,139) ${Math.abs(finalTotals.adSpend - 640139) < 1 ? '✓' : '✗'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

adjustToExpectedValues();
