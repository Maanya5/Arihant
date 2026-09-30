const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../utils/email');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_123',
});

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const options = {
      amount: order.totalAmount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_order_${order._id}`
    };

    const rzpOrder = await razorpay.orders.create(options);
    
    // Create pending payment
    const payment = await Payment.create({
      order: orderId,
      amount: order.totalAmount,
      method: 'Razorpay',
      status: 'pending',
      gatewayReferenceId: rzpOrder.id
    });

    order.paymentId = payment._id;
    await order.save();

    res.json({ rzpOrder, paymentId: payment._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_123')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment successful
      const payment = await Payment.findOne({ gatewayReferenceId: razorpay_order_id });
      if (payment) {
        payment.status = 'success';
        // gatewayReferenceId initially held rzpOrder_id. Now we can store payment_id or keep it.
        // Let's just update the status.
        await payment.save();
      }

      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();

        // Send Email asynchronously
        const user = await User.findById(req.user.id);
        if (user) {
          sendOrderConfirmation(user, order).catch(e => console.error("Email error:", e));
        }
      }

      return res.json({ message: "Payment verified", order });
    } else {
      return res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment by order ID
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Razorpay Webhook — extra layer of reliability
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body;
    if (event.event === 'payment.captured') {
      const { order_id } = event.payload.payment.entity;
      
      const payment = await Payment.findOne({ gatewayReferenceId: order_id });
      if (payment && payment.status !== 'success') {
        payment.status = 'success';
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.orderStatus = 'confirmed';
          await order.save();
          
          const user = await User.findById(order.user);
          if (user) {
            sendOrderConfirmation(user, order).catch(e => console.error("Email error:", e));
          }
        }
      }
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
