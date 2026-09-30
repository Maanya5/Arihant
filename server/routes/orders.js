const express = require('express');
const Order = require('../models/Order');
const { auth, admin } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { 
  createRazorpayOrder, 
  verifyPayment, 
  getOrderDetail, 
  getOrderHistory, 
  getAdminOrderList 
} = require('../controllers/orderController');
const { validateObjectId } = require('../middleware/security');
const { sendStatusUpdateEmail } = require('../services/emailService');
const User = require('../models/User');

const router = express.Router();

const orderRules = [
  body('orderData.items').isArray({ min: 1 }).withMessage('Your cart is empty.'),
  body('orderData.shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('orderData.shippingAddress.phone').notEmpty().withMessage('Phone number is required.'),
  body('orderData.shippingAddress.addressLine1').trim().notEmpty().withMessage('Address is required.'),
  body('orderData.shippingAddress.city').trim().notEmpty().withMessage('City is required.'),
  body('orderData.shippingAddress.state').trim().notEmpty().withMessage('State is required.'),
  body('orderData.shippingAddress.zipCode').notEmpty().withMessage('Pincode is required.')
];

// Create COD order
router.post('/', auth, async (req, res) => {
  let session = null;
  try {
    const orderData = req.body.orderData ? req.body.orderData : req.body;
    const { items, shippingAddress, couponCode } = orderData;
    
    const ProductVariant = require('../models/ProductVariant');
    const Product = require('../models/Product');
    const Payment = require('../models/Payment');
    const Coupon = require('../models/Coupon');
    const User = require('../models/User');
    const { sendOrderConfirmationEmails } = require('../services/emailService');

    // Try starting session
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }

    const opts = session ? { session } : {};

    const orderItems = [];
    let totalAmount = 0;

    for (const ci of items) {
      const dbProduct = await Product.findById(ci.product || ci.item_id)
        .populate('school_id')
        .populate('standard_id')
        .session(session);

      if (!dbProduct) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(404).json({ message: 'Item not found' });
      }

      const variant = await ProductVariant.findOne({ product_id: dbProduct._id, size: ci.size || ci.selected_size }).session(session);
      if (!variant) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(400).json({ message: 'Size not found' });
      }
      
      variant.stock_qty -= ci.quantity;
      if (variant.stock_qty <= 0) { variant.stock_qty = 0; variant.is_available = false; }
      await variant.save(opts);

      orderItems.push({
        product: dbProduct._id,
        variant: variant._id,
        itemName: dbProduct.name,
        itemType: dbProduct.item_type,
        schoolName: dbProduct.school_id ? dbProduct.school_id.name : 'Unknown',
        standardName: dbProduct.standard_id ? dbProduct.standard_id.class_name : 'Unknown',
        imageUrl: dbProduct.primary_image || (dbProduct.images && dbProduct.images[0] && dbProduct.images[0].url) || '',
        size: ci.size || ci.selected_size,
        quantity: ci.quantity,
        price_paisa: dbProduct.price_paisa
      });
      totalAmount += (dbProduct.price_paisa * ci.quantity);
    }

    // Handle coupon
    let discountAmount = 0;
    let validatedCouponCode = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        active: true,
        expiry: { $gt: new Date() }
      }).session(session);

      if (coupon) {
        const canUse = coupon.maxUses === null || coupon.usedCount < coupon.maxUses;
        const metMinOrder = totalAmount >= coupon.minOrder;
        if (canUse && metMinOrder) {
          validatedCouponCode = coupon.code;
          if (coupon.discountType === 'flat') {
            discountAmount = Math.min(coupon.value, totalAmount);
          } else if (coupon.discountType === 'percent') {
            discountAmount = Math.round((totalAmount * coupon.value) / 100);
          }
          // Atomic increment
          coupon.usedCount += 1;
          await coupon.save(opts);
        }
      }
    }

    const mappedAddress = {
      fullName: shippingAddress.fullName || shippingAddress.name,
      phone: shippingAddress.phone || shippingAddress.contact,
      street: shippingAddress.addressLine1 || shippingAddress.address,
      city: shippingAddress.city,
      pincode: shippingAddress.zipCode || shippingAddress.pincode,
      state: shippingAddress.state
    };

    // Calculate delivery date (simple rule-based Gujarat prefixes 36/38/39 => 2 days, others => 4 days)
    const pin = String(mappedAddress.pincode).trim();
    const isGujarat = ['36', '38', '39'].some(prefix => pin.startsWith(prefix));
    const days = isGujarat ? 2 : 4;
    const estDate = new Date();
    let addedDays = 0;
    while (addedDays < days) {
      estDate.setDate(estDate.getDate() + 1);
      if (estDate.getDay() !== 0) addedDays++;
    }

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount: totalAmount - discountAmount,
      shippingAddress: mappedAddress,
      orderStatus: 'pending',
      paymentStatus: 'pending',
      couponCode: validatedCouponCode,
      discountAmount,
      estimatedDelivery: estDate,
      tracking: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed using Cash on Delivery (COD)'
      }]
    });

    await order.save(opts);

    // Create payment record
    const payment = new Payment({
      order: order._id,
      amount: totalAmount - discountAmount,
      method: 'COD',
      status: 'pending'
    });
    await payment.save(opts);

    order.paymentId = payment._id;
    await order.save(opts);

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    const fullUser = await User.findById(req.user.id);
    if (fullUser) await sendOrderConfirmationEmails(order, fullUser).catch(e => console.error(e));

    res.status(201).json(order);
  } catch (error) {
    if (session) { await session.abortTransaction(); session.endSession(); }
    res.status(400).json({ message: error.message });
  }
});

// POST /api/orders/create-razorpay-order
router.post('/create-razorpay-order', auth, createRazorpayOrder);

// POST /api/orders/verify-payment
router.post('/verify-payment', auth, orderRules, validate, verifyPayment);

// Get user orders (List - Optimized with Aggregation)
router.get('/my-orders', auth, getOrderHistory);

// Get specific order detail (ID)
router.get('/my-orders/:id', auth, validateObjectId, getOrderDetail);

// Get all orders (Admin - Optimized Lean Query)
router.get('/', auth, admin, getAdminOrderList);


module.exports = router;

module.exports = router;
