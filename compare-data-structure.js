require('dotenv').config();
const mongoose = require('mongoose');

async function compareDataStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const db = mongoose.connection.db;
    
    // Get sample data from both users
    const taneshSample = await db.collection('dailymetrics')
      .findOne({ userId: new mongoose.Types.ObjectId('68c812b0afc4892c1f8128e3') });
    
    const anuragSample = await db.collection('dailymetrics')
      .findOne({ userId: new mongoose.Types.ObjectId('6882270af4c676a67f2fb70d') });

    console.log('=== Tanesh Data Structure ===');
    console.log(JSON.stringify(taneshSample, null, 2));
    
    console.log('\n=== Anurag Data Structure ===');
    console.log(JSON.stringify(anuragSample, null, 2));

    console.log('\n=== Field Comparison ===');
    const taneshFields = Object.keys(taneshSample || {});
    const anuragFields = Object.keys(anuragSample || {});
    
    console.log(`Tanesh fields: ${taneshFields.length}`);
    console.log(`Anurag fields: ${anuragFields.length}`);
    
    const missingInAnurag = taneshFields.filter(f => !anuragFields.includes(f));
    const extraInAnurag = anuragFields.filter(f => !taneshFields.includes(f));
    
    if (missingInAnurag.length > 0) {
      console.log(`\nMissing in Anurag: ${missingInAnurag.join(', ')}`);
    }
    
    if (extraInAnurag.length > 0) {
      console.log(`\nExtra in Anurag: ${extraInAnurag.join(', ')}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

compareDataStructure();
