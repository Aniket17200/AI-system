require('dotenv').config();
const mongoose = require('mongoose');

async function checkRawUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');

    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email: 'duttanurag321@gmail.com' });
    
    console.log('Raw user document:');
    console.log(JSON.stringify(user, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRawUser();
