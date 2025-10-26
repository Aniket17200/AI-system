const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');

async function verifyPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas\n');

    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('User found:', user.email);
    console.log('Stored hash:', user.password);
    console.log('\nTesting password: blvp43el8rP8');
    
    const isValid = await bcrypt.compare('blvp43el8rP8', user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('\n❌ Password does not match the stored hash');
      console.log('\nThe stored password hash is different from what "blvp43el8rP8" would produce.');
      console.log('\nOptions:');
      console.log('1. The password might be different');
      console.log('2. Update the password to "blvp43el8rP8" (type "yes" to update)');
    } else {
      console.log('\n✅ Password matches!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyPassword();
