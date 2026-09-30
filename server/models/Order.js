const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  standard: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolStandard' },
  items: [{
    product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variant:       { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    itemName:      String,        // snapshot at order time
    itemType:      String,        // snapshot at order time
    schoolName:    String,        // snapshot of school.name
    standardName:  String,        // snapshot of standard.class_name
    imageUrl:      String,        // snapshot of primary_image
    size:          String,
    quantity:      Number,
    price_paisa:   Number         // snapshot of price_paisa at order time
  }],
  totalAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  tracking: [{
    status:    { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note:      { type: String }
  }],
  estimatedDelivery: { type: Date, default: null },
  couponCode:        { type: String, default: null },
  discountAmount:    { type: Number, default: 0 },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    pincode: String,
    state: String
  },
  trackingNumber: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Optimization: Speed up "My Orders" view with reverse chronological sorting
orderSchema.index({ user: 1, createdAt: -1 });

// Optimization: Faster filtering for admin dashboard analytics and status management
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
