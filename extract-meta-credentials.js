require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function extractMetaCredentials() {
  try {
    console.log('🔧 Extracting Meta Ads Credentials from Onboarding\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const users = await usersCollection.find({}).toArray();
    
    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 User: ${user.email}`);
      console.log(`   User ID: ${user._id}\n`);

      // Extract Meta credentials from onboarding.step4
      if (user.onboarding?.step4) {
        const step4 = user.onboarding.step4;
        console.log('   📢 Found Meta Ads credentials in onboarding.step4:');
        console.log(`      Ad Account ID: ${step4.adAccountId}`);
        console.log(`      Access Token: ${step4.accessToken?.substring(0, 30)}...`);
        console.log(`      Platform: ${step4.platform}`);
        console.log('');

        // Format account ID with act_ prefix (remove existing act_ first to avoid duplication)
        let accountId = step4.adAccountId?.toString() || '';
        // Remove any existing act_ prefix
        accountId = accountId.replace(/^act_/, '');
        // Add single act_ prefix
        accountId = `act_${accountId}`;

        // Update user with extracted credentials
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: {
              metaAccessToken: step4.accessToken,
              metaAdAccountId: accountId
            }
          }
        );

        console.log('   ✅ Updated user with Meta credentials:');
        console.log(`      metaAccessToken: ${step4.accessToken.substring(0, 30)}...`);
        console.log(`      metaAdAccountId: ${accountId}`);
        console.log('');
      }

      // Extract Shiprocket credentials from onboarding.step5
      if (user.onboarding?.step5) {
        const step5 = user.onboarding.step5;
        console.log('   🚚 Found Shiprocket credentials in onboarding.step5:');
        console.log(`      Email: ${step5.email}`);
        console.log(`      Password: ${step5.password ? '***' : 'Not set'}`);
        console.log(`      Platform: ${step5.platform}`);
        console.log('');

        // Update user with extracted credentials
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: {
              shiprocketEmail: step5.email,
              shiprocketPassword: step5.password,
              shiprocketToken: step5.token
            }
          }
        );

        console.log('   ✅ Updated user with Shiprocket credentials');
        console.log('');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    await mongoose.disconnect();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Extraction Complete!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Credentials have been extracted and stored in standard fields.\n');
    console.log('Next steps:');
    console.log('1. Run: npm run check:meta (verify and sync Meta Ads data)');
    console.log('2. Run: npm run verify:db (see all data)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

extractMetaCredentials();
