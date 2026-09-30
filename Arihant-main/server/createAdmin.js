const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const makeAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  let user = await User.findOne({ email: 'admin@arihant.com' });
  if (!user) {
    user = new User({
      name: 'Admin User',
      email: 'admin@arihant.com',
      password: 'password123', // Will be hashed by pre-save
      role: 'admin'
    });
    await user.save();
    console.log('Admin user created: admin@arihant.com / password123');
  } else {
    user.role = 'admin';
    await user.save();
    console.log('Admin user updated');
  }
  process.exit(0);
};

makeAdmin();
