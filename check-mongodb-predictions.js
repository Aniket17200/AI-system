require('dotenv').config();
const mongoose = require('mongoose');
const Prediction = require('./models/Prediction');

async function checkMongoDBPredictions() {
  try {
    console.log('🔍 Checking MongoDB Predictions Storage\n');
    console.log('=' .repeat(70));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all predictions
    const predictions = await Prediction.find({}).sort({ createdAt: -1 });
    
    console.log(`Found ${predictions.length} prediction(s) in database\n`);

    predictions.forEach((pred, index) => {
      console.log(`\nPrediction ${index + 1}:`);
      console.log('=' .repeat(70));
      console.log(`Type: ${pred.predictionType}`);
      console.log(`Created: ${pred.createdAt}`);
      console.log(`Expires: ${pred.expiresAt}`);
      console.log(`AI Generated: ${pred.aiGenerated}`);
      console.log(`Confidence: ${pred.confidence}%`);
      
      if (pred.predictions && pred.predictions.monthly) {
        console.log('\nMonthly Predictions:');
        pred.predictions.monthly.forEach(month => {
          console.log(`\n  ${month.month} ${month.year}:`);
          console.log(`    Revenue: ₹${month.revenue.toLocaleString('en-IN')}`);
          console.log(`    Orders: ${month.orders}`);
          console.log(`    Profit: ₹${month.profit.toLocaleString('en-IN')}`);
          console.log(`    ROAS: ${month.roas}x`);
          console.log(`    Profit Margin: ${month.profitMargin}%`);
          
          // Check for negative values
          if (month.revenue < 0 || month.orders < 0 || month.profit < 0) {
            console.log(`    ❌ NEGATIVE VALUE DETECTED!`);
          }
        });
      }
    });

    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ MongoDB check complete\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMongoDBPredictions();
