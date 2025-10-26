require('dotenv').config();
const mongoose = require('mongoose');

async function addShippingData2025() {
  try {
    console.log('🚚 Adding Shipping Data for 2025\n');
    console.log('=' .repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const DailyMetrics = require('./models/DailyMetrics');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });

    // Get all metrics that have orders but no shipping data
    const metrics = await DailyMetrics.find({
      userId: user._id,
      totalOrders: { $gt: 0 },
      date: {
        $gte: new Date('2025-07-27'),
        $lte: new Date('2025-10-25')
      }
    }).sort({ date: 1 });

    console.log(`Found ${metrics.length} days with orders\n`);

    let updated = 0;

    for (const metric of metrics) {
      // Calculate shipping metrics based on orders
      const totalOrders = metric.totalOrders || 0;
      
      if (totalOrders > 0) {
        // Realistic shipping metrics
        const totalShipments = totalOrders;
        const deliveryRate = 0.84 + (Math.random() * 0.06); // 84-90%
        const rtoRate = 0.07 + (Math.random() * 0.03); // 7-10%
        const ndrRate = 0.03 + (Math.random() * 0.02); // 3-5%
        const inTransitRate = 1 - deliveryRate - rtoRate - ndrRate;
        
        const delivered = Math.round(totalShipments * deliveryRate);
        const rto = Math.round(totalShipments * rtoRate);
        const ndr = Math.round(totalShipments * ndrRate);
        const inTransit = Math.round(totalShipments * inTransitRate);
        
        // Calculate shipping cost (₹50-80 per shipment average)
        const avgShippingCost = 60 + (Math.random() * 20);
        const shippingCost = totalShipments * avgShippingCost;
        
        // Update the metric
        metric.totalShipments = totalShipments;
        metric.delivered = delivered;
        metric.rto = rto;
        metric.ndr = ndr;
        metric.inTransit = inTransit;
        metric.deliveryRate = (delivered / totalShipments) * 100;
        metric.rtoRate = (rto / totalShipments) * 100;
        metric.shippingCost = shippingCost;
        
        // Recalculate net profit with shipping cost
        metric.netProfit = metric.grossProfit - metric.adSpend - shippingCost;
        metric.netProfitMargin = metric.revenue > 0 ? (metric.netProfit / metric.revenue) * 100 : 0;
        
        await metric.save();
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} days with shipping data\n`);

    // Show sample
    const sample = await DailyMetrics.find({
      userId: user._id,
      totalShipments: { $gt: 0 }
    }).sort({ date: 1 }).limit(5);

    console.log('Sample days with shipping data:');
    sample.forEach(m => {
      console.log(`  ${m.date.toISOString().split('T')[0]}`);
      console.log(`    Shipments: ${m.totalShipments}`);
      console.log(`    Delivered: ${m.delivered} (${m.deliveryRate.toFixed(1)}%)`);
      console.log(`    RTO: ${m.rto} (${m.rtoRate.toFixed(1)}%)`);
      console.log(`    In Transit: ${m.inTransit}`);
      console.log(`    NDR: ${m.ndr}`);
      console.log(`    Shipping Cost: ₹${m.shippingCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
      console.log('');
    });

    console.log('✅ Shipping data added successfully!');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addShippingData2025();
