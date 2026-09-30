const crypto = require('crypto');
const mongoose = require('mongoose');
const { sendResponse, sendError } = require('../utils/responseHandler');
const razorpay = require('../config/razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { sendOrderConfirmationEmails } = require('../services/emailService');

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    
    // Create Razorpay order
    const options = {
      amount, // amount in paisa
      currency,
      receipt
    };
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    res.status(200).json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

const verifyPayment = async (req, res) => {
  let session = null;
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
    
    // 1. Verify Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac('sha256', secret || '')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
      
    console.log('[Payment Verification Debug]:', {
      hasSecret: !!secret,
      secretLength: secret ? secret.length : 0,
      razorpay_order_id,
      razorpay_payment_id,
      received_signature: razorpay_signature,
      generated_signature
    });

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Try starting session
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }

    const opts = session ? { session } : {};

    // 2. Process Order Data (Deduct Stock & Build Order)
    const { items, shippingAddress, couponCode } = orderData;

    if (!items || items.length === 0) {
      if (session) { await session.abortTransaction(); session.endSession(); }
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const ci of items) {
      const dbProduct = await Product.findById(ci.product || ci.item_id)
        .populate('school_id')
        .populate('standard_id')
        .session(session);

      if (!dbProduct) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(404).json({ success: false, message: 'Item not found in our catalogue.' });
      }

      // Find the variant for stock check
      const variant = await ProductVariant.findOne({ product_id: dbProduct._id, size: ci.size || ci.selected_size }).session(session);
      if (!variant) {
        if (session) { await session.abortTransaction(); session.endSession(); }
        return res.status(400).json({ success: false, message: `Size ${ci.size || ci.selected_size} is not available.` });
      }
      
      variant.stock_qty -= ci.quantity;
      if (variant.stock_qty <= 0) {
        variant.stock_qty = 0;
        variant.is_available = false;
      }
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
    const Coupon = require('../models/Coupon');
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

    // 3. Save Order to Database
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount: totalAmount - discountAmount,
      shippingAddress: mappedAddress,
      orderStatus: 'processing',
      paymentStatus: 'paid',
      couponCode: validatedCouponCode,
      discountAmount,
      estimatedDelivery: estDate,
      razorpay_order_id,
      razorpay_payment_id,
      tracking: [{
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Payment verified successfully via Razorpay'
      }]
    });
    await order.save(opts);

    // Create payment record
    const Payment = require('../models/Payment');
    const payment = new Payment({
      order: order._id,
      gatewayReferenceId: razorpay_payment_id,
      amount: totalAmount - discountAmount,
      method: 'UPI',
      status: 'success'
    });
    await payment.save(opts);

    order.paymentId = payment._id;
    await order.save(opts);

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // 4. Send Email Notifications
    const User = require('../models/User');
    const fullUser = await User.findById(req.user.id);
    if (fullUser) await sendOrderConfirmationEmails(order, fullUser).catch(e => console.error(e));

    res.status(200).json({ success: true, message: 'Payment verified and order saved', orderId: order._id });
  } catch (error) {
    if (session) { await session.abortTransaction(); session.endSession(); }
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || String(error) });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'items.product',
        select: 'name image_url price_paisa item_type'
      })
      .populate('school', 'name')
      .populate('standard', 'class_name gender');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Verify ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This order does not belong to you.' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Get Order Detail Error:', error);
    res.status(500).json({ message: 'Failed to fetch order details.' });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name image_url'
      })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Get User Orders Error:', error);
    res.status(500).json({ message: 'Failed to fetch your orders.' });
  }
};

/**
 * Optimization: Replacement for populate() using high-performance aggregation.
 * Implements cursor-based pagination and explicit projections.
 */
const getOrderHistory = async (req, res) => {
  try {
    const { limit = 10, lastOrderId } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const matchQuery = { user: userId };
    if (lastOrderId) {
      matchQuery._id = { $lt: new mongoose.Types.ObjectId(lastOrderId) };
    }

    const orders = await Order.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          orderStatus: 1,
          paymentStatus: 1,
          razorpay_order_id: 1,
          items: 1 // Items are denormalized snapshots, so no $lookup needed here as per schema summary
        }
      }
    ]);

    const nextCursor = orders.length > 0 ? orders[orders.length - 1]._id : null;
    
    return sendResponse(res, 200, orders, { nextCursor, limit: parseInt(limit) });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * Optimization: Lean query for high-volume admin dashboard views.
 */
const getAdminOrderList = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const orders = await Order.find()
      .select('user items paymentStatus orderStatus razorpay_order_id createdAt') // Explicit projection
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean(); // Optimization: Plain objects for faster rendering

    const total = await Order.countDocuments();

    return sendResponse(res, 200, orders, { total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  getOrderDetail,
  getUserOrders,
  getOrderHistory,
  getAdminOrderList
};

