require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createOrUpdateUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const email = 'duttanurag321@gmail.com';
    const password = '@Tmflove321';

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log('User exists. Updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
      console.log('✓ Password updated!');
    } else {
      console.log('User does not exist. Creating new user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        email,
        password: hashedPassword,
        name: 'Anurag Dutta'
      });
      await user.save();
      console.log('✓ User created!');
    }

    console.log(`\nUser details:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  ID: ${user._id}`);
    console.log(`  Name: ${user.name}`);

    await mongoose.connection.close();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createOrUpdateUser();
