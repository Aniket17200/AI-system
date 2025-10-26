require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function checkPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'taneshpurohit09@gmail.com' });
    
    if (user) {
      console.log('User found:', user.email);
      
      // Test common passwords
      const passwords = ['Tanesh@123', 'tanesh123', 'password', 'admin123'];
      
      for (const pwd of passwords) {
        const match = await bcrypt.compare(pwd, user.password);
        if (match) {
          console.log(`✓ Password is: ${pwd}`);
          break;
        }
      }
      
      console.log('\nIf no match, the password needs to be reset.');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPassword();
