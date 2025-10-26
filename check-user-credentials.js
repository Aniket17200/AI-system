require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'duttanurag321@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('User: ' + user.email);
    console.log('User ID: ' + user._id);
    console.log('\n=== API Credentials ===\n');

    // Shopify
    console.log('Shopify:');
    if (user.shopifyStore && user.shopifyAccessToken) {
      console.log('  ✓ Store: ' + user.shopifyStore);
      console.log('  ✓ Access Token: ' + user.shopifyAccessToken.substring(0, 20) + '...');
    } else {
      console.log('  ❌ Not configured');
    }

    // Shiprocket
    console.log('\nShiprocket:');
    if (user.shiprocketEmail && user.shiprocketPassword) {
      console.log('  ✓ Email: ' + user.shiprocketEmail);
      console.log('  ✓ Password: ' + (user.shiprocketPassword ? '***' : 'Not set'));
    } else {
      console.log('  ❌ Not configured');
    }

    // Meta Ads
    console.log('\nMeta Ads:');
    if (user.metaAccessToken && user.metaAdAccountId) {
      console.log('  ✓ Access Token: ' + user.metaAccessToken.substring(0, 20) + '...');
      console.log('  ✓ Ad Account ID: ' + user.metaAdAccountId);
    } else {
      console.log('  ❌ Not configured');
    }

    console.log('\n=== Summary ===');
    const hasShopify = !!(user.shopifyStore && user.shopifyAccessToken);
    const hasShiprocket = !!(user.shiprocketEmail && user.shiprocketPassword);
    const hasMeta = !!(user.metaAccessToken && user.metaAdAccountId);

    console.log('Shopify: ' + (hasShopify ? '✓' : '❌'));
    console.log('Shiprocket: ' + (hasShiprocket ? '✓' : '❌'));
    console.log('Meta Ads: ' + (hasMeta ? '✓' : '❌'));

    if (hasShopify && hasShiprocket && hasMeta) {
      console.log('\n✓ All credentials are configured! Ready to sync data.');
    } else {
      console.log('\n⚠ Some credentials are missing. Please add them first.');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCredentials();
