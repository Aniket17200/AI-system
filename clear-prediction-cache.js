require('dotenv').config();
const mongoose = require('mongoose');
const Prediction = require('./models/Prediction');

async function clearPredictionCache() {
  try {
    console.log('🗑️  Clearing Prediction Cache\n');
    console.log('=' .repeat(70));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Delete all cached predictions
    const result = await Prediction.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} cached predictions\n`);

    console.log('=' .repeat(70));
    console.log('\n✅ Cache cleared! Next request will generate fresh predictions.\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearPredictionCache();
