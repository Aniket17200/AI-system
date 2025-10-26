require('dotenv').config();
const mongoose = require('mongoose');

// Connection strings
const LOCAL_URI = 'mongodb://localhost:27017/profitfirstuser';
const CLOUD_URI = 'mongodb+srv://aniketgaikwad72002_db_user:mxwWMkRQ3n3l8SqQ@cluster0.ieytfv3.mongodb.net/profitfirstuser?retryWrites=true&w=majority&appName=Cluster0';

async function migrateToAtlas() {
  console.log('=== MongoDB Atlas Migration ===\n');
  
  try {
    // Connect to local MongoDB
    console.log('Step 1: Connecting to local MongoDB...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✓ Connected to local MongoDB\n');

    // Connect to Atlas
    console.log('Step 2: Connecting to MongoDB Atlas...');
    const cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
    console.log('✓ Connected to MongoDB Atlas\n');

    // Get all collections from local
    console.log('Step 3: Getting collections from local database...');
    const collections = await localConn.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:\n`);
    collections.forEach(c => console.log(`  - ${c.name}`));

    // Migrate each collection
    console.log('\nStep 4: Migrating data...\n');
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Migrating ${collectionName}...`);
      
      const localCollection = localConn.db.collection(collectionName);
      const cloudCollection = cloudConn.db.collection(collectionName);
      
      // Get all documents
      const documents = await localCollection.find({}).toArray();
      console.log(`  Found ${documents.length} documents`);
      
      if (documents.length > 0) {
        // Clear existing data in cloud (optional - comment out if you want to keep existing)
        await cloudCollection.deleteMany({});
        console.log(`  Cleared existing data in cloud`);
        
        // Insert all documents
        await cloudCollection.insertMany(documents);
        console.log(`  ✓ Migrated ${documents.length} documents\n`);
      } else {
        console.log(`  No documents to migrate\n`);
      }
    }

    // Verify migration
    console.log('Step 5: Verifying migration...\n');
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const localCount = await localConn.db.collection(collectionName).countDocuments();
      const cloudCount = await cloudConn.db.collection(collectionName).countDocuments();
      
      console.log(`${collectionName}:`);
      console.log(`  Local: ${localCount} documents`);
      console.log(`  Cloud: ${cloudCount} documents`);
      console.log(`  Status: ${localCount === cloudCount ? '✓ Match' : '✗ Mismatch'}\n`);
    }

    // Close connections
    await localConn.close();
    await cloudConn.close();

    console.log('=== Migration Complete ===\n');
    console.log('Next steps:');
    console.log('1. Update .env file with cloud connection string');
    console.log('2. Restart the server');
    console.log('3. Test the application');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateToAtlas();
