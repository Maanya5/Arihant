const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['flat', 'percent'],
    required: true
  },
  value: {
    type: Number,
    required: true // flat = paise amount, percent = 0-100
  },
  minOrder: {
    type: Number,
    default: 0 // minimum cart total in paise
  },
  maxUses: {
    type: Number,
    default: null // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiry: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: { type: Date, default: Date.now }
});


couponSchema.index({ active: 1, expiry: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
