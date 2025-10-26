require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function migrateCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('User: ' + user.email);
    console.log('Migrating credentials from onboarding data...\n');

    // Extract credentials from onboarding
    const shopifyData = user.onboarding?.step2;
    const metaData = user.onboarding?.step4;
    const shiprocketData = user.onboarding?.step5;

    let updated = false;

    // Update user with credentials using direct update
    const updateData = {};

    if (shopifyData) {
      updateData.shopifyStore = shopifyData.storeUrl;
      updateData.shopifyAccessToken = shopifyData.accessToken;
      console.log('✓ Shopify credentials found');
      console.log('  Store: ' + shopifyData.storeUrl);
      updated = true;
    }

    if (metaData) {
      updateData.metaAdAccountId = metaData.adAccountId;
      updateData.metaAccessToken = metaData.accessToken;
      console.log('✓ Meta Ads credentials found');
      console.log('  Ad Account: ' + metaData.adAccountId);
      updated = true;
    }

    if (shiprocketData) {
      updateData.shiprocketEmail = shiprocketData.email;
      updateData.shiprocketPassword = shiprocketData.password;
      updateData.shiprocketToken = shiprocketData.token;
      console.log('✓ Shiprocket credentials found');
      console.log('  Email: ' + shiprocketData.email);
      updated = true;
    }

    if (updated) {
      await User.updateOne(
        { _id: user._id },
        { $set: updateData }
      );
      console.log('\n✓ Credentials saved to database');
    }
    console.log('\n✓ All credentials migrated successfully!');
    console.log('\nUser is now ready for data sync.');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

migrateCredentials();
