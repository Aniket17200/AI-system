require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function addMetaCredentials() {
  try {
    console.log('🔧 Adding Meta Ads Credentials\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Tanesh user
    const taneshUser = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    if (!taneshUser) {
      console.log('❌ Tanesh user not found!');
      console.log('Creating Tanesh user with Shopify credentials...\n');
      
      const newUser = new User({
        email: 'taneshpurohit09@gmail.com',
        shopifyStore: 'e23104-8c.myshopify.com',
        shopifyAccessToken: 'YOUR_SHOPIFY_ACCESS_TOKEN',
        isActive: true
      });
      
      await newUser.save();
      console.log('✅ Tanesh user created!');
      console.log('   User ID:', newUser._id);
      console.log('   Email:', newUser.email);
      console.log('\n');
    } else {
      console.log('✅ Found Tanesh user');
      console.log('   User ID:', taneshUser._id);
      console.log('   Email:', taneshUser.email);
      console.log('\n');
      
      // Update with Shopify credentials if missing
      if (!taneshUser.shopifyStore) {
        taneshUser.shopifyStore = 'e23104-8c.myshopify.com';
        taneshUser.shopifyAccessToken = 'YOUR_SHOPIFY_ACCESS_TOKEN';
        taneshUser.isActive = true;
        await taneshUser.save();
        console.log('✅ Updated Shopify credentials for Tanesh\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📢 META ADS CREDENTIALS NEEDED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('To add Meta Ads credentials, you need:');
    console.log('1. Meta Access Token');
    console.log('2. Meta Ad Account ID\n');
    console.log('Get them from: https://developers.facebook.com/tools/explorer/\n');
    console.log('Then run this command:\n');
    console.log('curl -X PUT http://localhost:5000/api/users/' + (taneshUser?._id || 'USER_ID') + ' \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{\n    "metaAccessToken": "YOUR_META_ACCESS_TOKEN",\n    "metaAdAccountId": "act_YOUR_AD_ACCOUNT_ID"\n  }\'');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addMetaCredentials();
