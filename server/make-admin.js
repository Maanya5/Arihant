require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if it's placed differently

const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.error("Please provide an email to promote. Usage:\n  node make-admin.js your_email@example.com");
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const user = await User.findOne({ email: emailToPromote });
    
    if (!user) {
      console.log(`❌ Failed to find user with email: ${emailToPromote}`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    
    console.log(`✅ Success! ${user.email} (${user.name}) has been promoted to Admin role.`);
    console.log(`Please login again on the frontend to refresh your JWT and access the Admin Panel.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
};

run();
