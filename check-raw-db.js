require('dotenv').config();
const mongoose = require('mongoose');

async function checkRawDB() {
  try {
    console.log('🔍 Checking Raw Database Fields\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get users collection directly (raw)
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const users = await usersCollection.find({}).toArray();
    
    console.log(`Found ${users.length} user(s)\n`);

    users.forEach((user, index) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`User ${index + 1}:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(JSON.stringify(user, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Now update the user with Meta credentials
    const userWithMeta = users.find(u => u.adAccountId || u.accessToken);
    
    if (userWithMeta) {
      console.log('✅ Found user with Meta credentials!');
      console.log('   Email:', userWithMeta.email);
      console.log('   Ad Account ID:', userWithMeta.adAccountId);
      console.log('   Access Token:', userWithMeta.accessToken ? userWithMeta.accessToken.substring(0, 30) + '...' : 'Not set');
      console.log('\n🔄 Updating to standard field names...\n');

      const accountId = userWithMeta.adAccountId?.startsWith('act_') 
        ? userWithMeta.adAccountId 
        : `act_${userWithMeta.adAccountId}`;

      await usersCollection.updateOne(
        { _id: userWithMeta._id },
        { 
          $set: {
            metaAccessToken: userWithMeta.accessToken,
            metaAdAccountId: accountId
          }
        }
      );

      console.log('✅ Updated!');
      console.log('   metaAccessToken:', userWithMeta.accessToken.substring(0, 30) + '...');
      console.log('   metaAdAccountId:', accountId);
      console.log('\n');
    } else {
      console.log('⚠️  No user found with Meta credentials (adAccountId/accessToken fields)\n');
    }

    await mongoose.disconnect();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Check Complete!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Next: npm run check:meta\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkRawDB();
