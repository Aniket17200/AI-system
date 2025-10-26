require('dotenv').config();
const mongoose = require('mongoose');

async function checkUserIdType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const db = mongoose.connection.db;
    
    // Get a sample record
    const sample = await db.collection('dailymetrics').findOne({ 
      userId: new mongoose.Types.ObjectId('6882270af4c676a67f2fb70d')
    });

    if (sample) {
      console.log('Sample record found:');
      console.log(`  Date: ${sample.date.toISOString().split('T')[0]}`);
      console.log(`  UserId type: ${typeof sample.userId}`);
      console.log(`  UserId value: ${sample.userId}`);
      console.log(`  Revenue: ₹${sample.revenue || 0}`);
      console.log(`  Orders: ${sample.totalOrders || 0}`);
    } else {
      console.log('No record found with ObjectId');
      
      // Try with string
      const sampleStr = await db.collection('dailymetrics').findOne({ 
        userId: '6882270af4c676a67f2fb70d'
      });
      
      if (sampleStr) {
        console.log('Found with string userId!');
        console.log(`  UserId type: ${typeof sampleStr.userId}`);
        console.log(`  UserId value: ${sampleStr.userId}`);
      }
    }

    // Count both ways
    const countObj = await db.collection('dailymetrics').countDocuments({ 
      userId: new mongoose.Types.ObjectId('6882270af4c676a67f2fb70d')
    });
    
    const countStr = await db.collection('dailymetrics').countDocuments({ 
      userId: '6882270af4c676a67f2fb70d'
    });

    console.log(`\nCount with ObjectId: ${countObj}`);
    console.log(`Count with String: ${countStr}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkUserIdType();
