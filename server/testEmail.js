require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');
const { sendStatusUpdateEmail } = require('./services/emailService');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const order = await Order.findOne().populate('user');
    if (!order) {
      console.log('No order found');
      process.exit(0);
    }
    console.log('Found order:', order._id);
    await sendStatusUpdateEmail(order, order.user);
    console.log('Done!');
  } catch(e) {
    console.error('Caught error:', e);
  }
  process.exit(0);
}

test();
