require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function showCredentials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('User: ' + user.email);
    console.log('\n=== API Credentials (for reference) ===\n');

    console.log('Shopify:');
    console.log('  Store: ' + (user.shopifyStore || 'Not set'));
    console.log('  Access Token: ' + (user.shopifyAccessToken ? user.shopifyAccessToken.substring(0, 30) + '...' : 'Not set'));

    console.log('\nShiprocket:');
    console.log('  Email: ' + (user.shiprocketEmail || 'Not set'));
    console.log('  Password: ' + (user.shiprocketPassword ? '***' : 'Not set'));

    console.log('\nMeta Ads:');
    console.log('  Access Token: ' + (user.metaAccessToken ? user.metaAccessToken.substring(0, 30) + '...' : 'Not set'));
    console.log('  Ad Account ID: ' + (user.metaAdAccountId || 'Not set'));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

showCredentials();
