require('dotenv').config();
const mongoose = require('mongoose');

async function migrateCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email: 'duttanurag321@gmail.com' });
    
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('Migrating credentials for: ' + user.email);

    const updateData = {
      shopifyStore: user.onboarding.step2.storeUrl,
      shopifyAccessToken: user.onboarding.step2.accessToken,
      metaAdAccountId: user.onboarding.step4.adAccountId,
      metaAccessToken: user.onboarding.step4.accessToken,
      shiprocketEmail: user.onboarding.step5.email,
      shiprocketPassword: user.onboarding.step5.password,
      shiprocketToken: user.onboarding.step5.token
    };

    console.log('\nCredentials to migrate:');
    console.log('  Shopify Store: ' + updateData.shopifyStore);
    console.log('  Meta Ad Account: ' + updateData.metaAdAccountId);
    console.log('  Shiprocket Email: ' + updateData.shiprocketEmail);

    const result = await db.collection('users').updateOne(
      { email: 'duttanurag321@gmail.com' },
      { $set: updateData }
    );

    console.log('\n✓ Update result: ' + result.modifiedCount + ' document(s) modified');

    // Verify
    const updatedUser = await db.collection('users').findOne({ email: 'duttanurag321@gmail.com' });
    console.log('\nVerification:');
    console.log('  shopifyStore: ' + (updatedUser.shopifyStore || 'NOT SET'));
    console.log('  metaAdAccountId: ' + (updatedUser.metaAdAccountId || 'NOT SET'));
    console.log('  shiprocketEmail: ' + (updatedUser.shiprocketEmail || 'NOT SET'));

    await mongoose.connection.close();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateCredentials();
