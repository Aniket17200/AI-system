require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyMetrics = require('./models/DailyMetrics');

async function verifyCloudConnection() {
  console.log('=== Verifying Cloud MongoDB Connection ===\n');
  
  try {
    // Check environment variable
    console.log('Step 1: Checking environment variables...');
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI not found in .env file');
    }
    
    if (process.env.MONGODB_URI.includes('localhost') || process.env.MONGODB_URI.includes('127.0.0.1')) {
      throw new Error('❌ MONGODB_URI is still pointing to localhost!');
    }
    
    if (!process.env.MONGODB_URI.includes('mongodb+srv://')) {
      console.warn('⚠️  Warning: MONGODB_URI does not appear to be a MongoDB Atlas connection string');
    }
    
    console.log('✓ MONGODB_URI is set to cloud connection');
    console.log(`  Connection: ${process.env.MONGODB_URI.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);

    // Connect to database
    console.log('Step 2: Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected successfully\n');

    // Get connection details
    console.log('Step 3: Verifying connection details...');
    const connection = mongoose.connection;
    console.log(`  Host: ${connection.host}`);
    console.log(`  Database: ${connection.name}`);
    console.log(`  Port: ${connection.port || 'N/A (Cloud)'}`);
    console.log(`  Ready State: ${connection.readyState === 1 ? 'Connected' : 'Not Connected'}\n`);

    // Verify it's not localhost
    if (connection.host.includes('localhost') || connection.host.includes('127.0.0.1')) {
      throw new Error('❌ Still connected to localhost!');
    }
    console.log('✓ Confirmed: Not connected to localhost\n');

    // Check collections
    console.log('Step 4: Checking collections...');
    const collections = await connection.db.listCollections().toArray();
    console.log(`  Found ${collections.length} collections:`);
    
    for (const col of collections) {
      const count = await connection.db.collection(col.name).countDocuments();
      console.log(`    - ${col.name}: ${count} documents`);
    }
    console.log();

    // Check users
    console.log('Step 5: Verifying data access...');
    const userCount = await User.countDocuments();
    const metricsCount = await DailyMetrics.countDocuments();
    
    console.log(`  Users: ${userCount}`);
    console.log(`  Daily Metrics: ${metricsCount}\n`);

    if (userCount === 0) {
      console.warn('⚠️  Warning: No users found in database');
    }
    if (metricsCount === 0) {
      console.warn('⚠️  Warning: No daily metrics found in database');
    }

    // Sample user data
    if (userCount > 0) {
      const users = await User.find({}).select('email businessName createdAt');
      console.log('Step 6: Sample users:');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.businessName || 'No business name'})`);
      });
      console.log();
    }

    await mongoose.connection.close();
    
    console.log('=== ✓ ALL CHECKS PASSED ===\n');
    console.log('✅ System is using MongoDB Atlas (Cloud)');
    console.log('✅ No local MongoDB connections detected');
    console.log('✅ Data is accessible and verified\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

verifyCloudConnection();
