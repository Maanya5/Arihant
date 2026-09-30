const express = require('express');
const rateLimit = require('express-rate-limit');
const Coupon = require('../models/Coupon');

const router = express.Router();

const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many coupon validation requests. Please wait.' }
});

/**
 * POST /api/coupons/validate
 * Body: { code: String, cartTotal: Number } (cartTotal in paise)
 * Returns: { valid: true, discountAmount: Number, message: String }
 */
router.post('/validate', couponLimiter, async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || typeof cartTotal !== 'number') {
      return res.status(400).json({ valid: false, message: 'Code and cart total are required.' });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      active: true,
      expiry: { $gt: new Date() }
    });

    if (!coupon) {
      return res.json({ valid: false, message: 'This coupon code is invalid or has expired.' });
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.json({ valid: false, message: 'This coupon has reached its maximum usage limit.' });
    }

    // Check minimum order
    if (cartTotal < coupon.minOrder) {
      const minOrderRupees = (coupon.minOrder / 100).toLocaleString('en-IN');
      return res.json({
        valid: false,
        message: `Minimum order of ₹${minOrderRupees} required to use this coupon.`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'flat') {
      discountAmount = Math.min(coupon.value, cartTotal); // don't exceed cart total
    } else if (coupon.discountType === 'percent') {
      discountAmount = Math.round((cartTotal * coupon.value) / 100);
    }

    return res.json({
      valid: true,
      discountAmount,
      couponType: coupon.discountType,
      couponValue: coupon.value,
      message: coupon.discountType === 'percent'
        ? `${coupon.value}% off applied!`
        : `₹${(discountAmount / 100).toLocaleString('en-IN')} off applied!`
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Coupon validation failed. Please try again.' });
  }
});

module.exports = router;
