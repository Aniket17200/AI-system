require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');
    
    const db = mongoose.connection.db;
    
    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log(`Total users: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ${u.email} (${u._id})`);
    });

    // Check metrics for Anurag
    const anuragId = '6882270af4c676a67f2fb70d';
    const count = await db.collection('dailymetrics').countDocuments({ 
      userId: new mongoose.Types.ObjectId(anuragId)
    });
    
    console.log(`\nMetrics for duttanurag321@gmail.com: ${count} records`);

    if (count > 0) {
      const sample = await db.collection('dailymetrics')
        .find({ userId: new mongoose.Types.ObjectId(anuragId) })
        .sort({ date: -1 })
        .limit(5)
        .toArray();

      console.log('\nSample data (latest 5):');
      sample.forEach(m => {
        console.log(`  ${m.date.toISOString().split('T')[0]}: Revenue=₹${m.revenue || 0}, Orders=${m.totalOrders || 0}, AdSpend=₹${(m.adSpend || 0).toFixed(2)}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkDatabase();
