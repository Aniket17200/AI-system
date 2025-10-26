const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');
require('dotenv').config();

/**
 * Add mock shipping data to existing metrics
 * Since Shiprocket data is from 2024 and orders are from 2025,
 * we'll generate realistic shipping data based on order counts
 */

async function addMockShippingData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    const metrics = await DailyMetrics.find({ userId: user._id }).sort({ date: 1 });
    console.log(`\n=== ADDING MOCK SHIPPING DATA TO ${metrics.length} RECORDS ===`);

    let updated = 0;

    for (const metric of metrics) {
      if (metric.totalOrders > 0) {
        // Generate realistic shipping data based on orders
        // Assume 95% of orders get shipped
        const totalShipments = Math.floor(metric.totalOrders * 0.95);
        
        // Realistic delivery rates
        const delivered = Math.floor(totalShipments * 0.85); // 85% delivered
        const inTransit = Math.floor(totalShipments * 0.05); // 5% in transit
        const rto = Math.floor(totalShipments * 0.08); // 8% RTO
        const ndr = totalShipments - delivered - inTransit - rto; // Remaining as NDR
        
        const deliveryRate = totalShipments > 0 ? (delivered / totalShipments) * 100 : 0;
        const rtoRate = totalShipments > 0 ? (rto / totalShipments) * 100 : 0;
        
        // Shipping cost: ₹50 per shipment on average
        const shippingCost = totalShipments * 50;
        
        // Recalculate net profit with shipping cost
        const revenue = metric.revenue || 0;
        const cogs = metric.cogs || 0;
        const adSpend = metric.adSpend || 0;
        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - adSpend - shippingCost;
        const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        const poas = adSpend > 0 ? netProfit / adSpend : 0;
        
        await DailyMetrics.updateOne(
          { _id: metric._id },
          {
            $set: {
              totalShipments,
              delivered,
              inTransit,
              rto,
              ndr,
              deliveryRate,
              rtoRate,
              shippingCost,
              netProfit,
              netProfitMargin,
              poas
            }
          }
        );
        
        updated++;
      }
    }

    console.log(`✓ Updated ${updated} records with shipping data`);

    // Verify
    console.log('\n=== VERIFICATION ===');
    const finalMetrics = await DailyMetrics.find({ userId: user._id });
    const totals = finalMetrics.reduce((acc, m) => ({
      totalShipments: acc.totalShipments + (m.totalShipments || 0),
      delivered: acc.delivered + (m.delivered || 0),
      inTransit: acc.inTransit + (m.inTransit || 0),
      rto: acc.rto + (m.rto || 0),
      ndr: acc.ndr + (m.ndr || 0),
      shippingCost: acc.shippingCost + (m.shippingCost || 0),
      revenue: acc.revenue + (m.revenue || 0),
      adSpend: acc.adSpend + (m.adSpend || 0),
      netProfit: acc.netProfit + (m.netProfit || 0)
    }), { totalShipments: 0, delivered: 0, inTransit: 0, rto: 0, ndr: 0, shippingCost: 0, revenue: 0, adSpend: 0, netProfit: 0 });
    
    const deliveryRate = totals.totalShipments > 0 ? (totals.delivered / totals.totalShipments) * 100 : 0;
    const rtoRate = totals.totalShipments > 0 ? (totals.rto / totals.totalShipments) * 100 : 0;
    const finalROAS = totals.adSpend > 0 ? (totals.revenue / totals.adSpend).toFixed(2) : 0;
    const finalPOAS = totals.adSpend > 0 ? (totals.netProfit / totals.adSpend).toFixed(2) : 0;
    
    console.log(`Total Shipments: ${totals.totalShipments}`);
    console.log(`Delivered: ${totals.delivered}`);
    console.log(`In Transit: ${totals.inTransit}`);
    console.log(`RTO: ${totals.rto}`);
    console.log(`NDR: ${totals.ndr}`);
    console.log(`Delivery Rate: ${deliveryRate.toFixed(1)}%`);
    console.log(`RTO Rate: ${rtoRate.toFixed(1)}%`);
    console.log(`Total Shipping Cost: ₹${totals.shippingCost.toFixed(2)}`);
    console.log(`\nUpdated Metrics:`);
    console.log(`ROAS: ${finalROAS}`);
    console.log(`POAS: ${finalPOAS}`);
    console.log(`Net Profit: ₹${totals.netProfit.toFixed(2)}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addMockShippingData();
