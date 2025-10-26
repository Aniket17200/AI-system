const mongoose = require('mongoose');
const DailyMetrics = require('./models/DailyMetrics');

async function cleanupDuplicates() {
  try {
    console.log('🧹 Cleaning up duplicate daily metrics...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const userId = '68c812b0afc4892c1f8128e3';
    const startDate = new Date('2025-09-26');
    const endDate = new Date('2025-10-25');
    endDate.setHours(23, 59, 59, 999);

    // Find all records in the date range
    const allRecords = await DailyMetrics.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    console.log(`Found ${allRecords.length} records\n`);

    // Group by date (YYYY-MM-DD)
    const grouped = {};
    allRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    });

    console.log(`Grouped into ${Object.keys(grouped).length} unique dates\n`);

    let duplicatesRemoved = 0;

    // For each date, keep only the record with most orders
    for (const [dateKey, records] of Object.entries(grouped)) {
      if (records.length > 1) {
        console.log(`Date ${dateKey} has ${records.length} records:`);
        records.forEach(r => {
          console.log(`  - ${r.date.toISOString()}: ${r.totalOrders} orders, ₹${Math.round(r.revenue)}`);
        });

        // Sort by totalOrders descending and keep the one with most orders
        records.sort((a, b) => b.totalOrders - a.totalOrders);
        const keepRecord = records[0];
        const removeRecords = records.slice(1);

        console.log(`  ✅ Keeping: ${keepRecord.date.toISOString()} (${keepRecord.totalOrders} orders)`);
        
        for (const record of removeRecords) {
          await DailyMetrics.deleteOne({ _id: record._id });
          console.log(`  ❌ Removed: ${record.date.toISOString()} (${record.totalOrders} orders)`);
          duplicatesRemoved++;
        }
        console.log('');
      }
    }

    console.log('='.repeat(60));
    console.log(`✅ Cleanup complete!`);
    console.log(`   Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   Unique dates remaining: ${Object.keys(grouped).length}`);
    console.log('='.repeat(60));

    // Verify final count
    const finalRecords = await DailyMetrics.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const totals = finalRecords.reduce((acc, r) => ({
      orders: acc.orders + r.totalOrders,
      revenue: acc.revenue + r.revenue
    }), { orders: 0, revenue: 0 });

    console.log(`\nFinal totals:`);
    console.log(`  Orders: ${totals.orders}`);
    console.log(`  Revenue: ₹${Math.round(totals.revenue).toLocaleString('en-IN')}`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
