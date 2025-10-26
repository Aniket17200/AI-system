require('dotenv').config();
const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function addSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const userId = '6882270af4c676a67f2fb70d';
    
    console.log('=== Adding Sample Data for Recent Dates ===\n');
    console.log('Note: This is SAMPLE data for demonstration purposes.\n');
    
    // Sample data for today and yesterday
    const sampleDates = [
      {
        date: new Date('2025-10-25T00:00:00.000Z'),
        revenue: 2499,
        orders: 2,
        adSpend: 450,
        shipments: 2
      },
      {
        date: new Date('2025-10-24T00:00:00.000Z'),
        revenue: 1899,
        orders: 1,
        adSpend: 380,
        shipments: 1
      }
    ];
    
    for (const sample of sampleDates) {
      const dateStr = sample.date.toISOString().split('T')[0];
      
      // Delete existing entry
      await DailyMetrics.deleteOne({
        userId,
        date: {
          $gte: new Date(dateStr + 'T00:00:00.000Z'),
          $lte: new Date(dateStr + 'T23:59:59.999Z')
        }
      });
      
      // Calculate metrics
      const cogs = sample.revenue * 0.35;
      const grossProfit = sample.revenue - cogs;
      const netProfit = grossProfit - sample.adSpend;
      const roas = sample.adSpend > 0 ? sample.revenue / sample.adSpend : 0;
      const aov = sample.orders > 0 ? sample.revenue / sample.orders : 0;
      
      // Create new entry with sample data
      await DailyMetrics.create({
        userId,
        date: sample.date,
        revenue: sample.revenue,
        totalOrders: sample.orders,
        adSpend: sample.adSpend,
        cogs: Math.round(cogs),
        grossProfit: Math.round(grossProfit),
        grossProfitMargin: (grossProfit / sample.revenue) * 100,
        netProfit: Math.round(netProfit),
        netProfitMargin: (netProfit / sample.revenue) * 100,
        roas: Math.round(roas * 100) / 100,
        poas: sample.adSpend > 0 ? netProfit / sample.adSpend : 0,
        aov: Math.round(aov),
        cpp: sample.orders > 0 ? sample.adSpend / sample.orders : 0,
        cpc: 2.5,
        ctr: 1.8,
        cpm: 45,
        reach: Math.round(sample.adSpend * 15),
        impressions: Math.round(sample.adSpend * 20),
        linkClicks: Math.round(sample.adSpend / 2.5),
        newCustomers: sample.orders,
        returningCustomers: 0,
        totalCustomers: sample.orders,
        returningRate: 0,
        totalShipments: sample.shipments,
        delivered: 0,
        inTransit: sample.shipments,
        rto: 0,
        ndr: 0,
        deliveryRate: 0,
        rtoRate: 0,
        shippingCost: sample.shipments * 80,
        campaigns: []
      });
      
      console.log(`✓ ${dateStr}: Added sample data`);
      console.log(`  Revenue: ₹${sample.revenue}, Orders: ${sample.orders}, ROAS: ${roas.toFixed(2)}x`);
    }
    
    console.log(`\n=== Verification ===`);
    
    const today = await DailyMetrics.findOne({
      userId,
      date: {
        $gte: new Date('2025-10-25T00:00:00.000Z'),
        $lte: new Date('2025-10-25T23:59:59.999Z')
      }
    });
    
    const yesterday = await DailyMetrics.findOne({
      userId,
      date: {
        $gte: new Date('2025-10-24T00:00:00.000Z'),
        $lte: new Date('2025-10-24T23:59:59.999Z')
      }
    });
    
    console.log(`Today: Rev=₹${today.revenue}, Orders=${today.totalOrders}, ROAS=${today.roas}x`);
    console.log(`Yesterday: Rev=₹${yesterday.revenue}, Orders=${yesterday.totalOrders}, ROAS=${yesterday.roas}x`);

    await mongoose.connection.close();
    console.log('\n✓ Done! Frontend will now show sample data for today and yesterday.');
    console.log('\nIMPORTANT: This is SAMPLE data for demonstration.');
    console.log('Real data will come from Shopify API when orders are placed.');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addSampleData();
