require('dotenv').config();
const mongoose = require('mongoose');

async function migrateMeta() {
  try {
    console.log('🔄 Migrating Meta Ads Fields\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get users collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find users with old Meta fields
    const users = await usersCollection.find({
      $or: [
        { adAccountId: { $exists: true } },
        { accessToken: { $exists: true } }
      ]
    }).toArray();

    console.log(`Found ${users.length} user(s) with Meta credentials\n`);

    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 User: ${user.email}`);
      console.log(`   User ID: ${user._id}`);
      console.log('\n   Current Fields:');
      console.log(`   - adAccountId: ${user.adAccountId || 'Not set'}`);
      console.log(`   - accessToken: ${user.accessToken ? user.accessToken.substring(0, 30) + '...' : 'Not set'}`);
      console.log(`   - platform: ${user.platform || 'Not set'}`);

      // Migrate to new field names
      const updateFields = {};
      
      if (user.adAccountId) {
        // Add 'act_' prefix if not present
        const accountId = user.adAccountId.startsWith('act_') 
          ? user.adAccountId 
          : `act_${user.adAccountId}`;
        updateFields.metaAdAccountId = accountId;
      }
      
      if (user.accessToken) {
        updateFields.metaAccessToken = user.accessToken;
      }

      if (Object.keys(updateFields).length > 0) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updateFields }
        );

        console.log('\n   ✅ Migrated to:');
        console.log(`   - metaAdAccountId: ${updateFields.metaAdAccountId || 'N/A'}`);
        console.log(`   - metaAccessToken: ${updateFields.metaAccessToken ? updateFields.metaAccessToken.substring(0, 30) + '...' : 'N/A'}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    await mongoose.disconnect();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration Complete!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Run: npm run check:meta (to verify and sync)');
    console.log('2. Run: npm run verify:db (to see the data)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

migrateMeta();
