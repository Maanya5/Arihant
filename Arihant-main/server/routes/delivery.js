const express = require('express');
const router = express.Router();

/**
 * POST /api/delivery/estimate
 * Body: { pincode: String }
 * Returns: { estimatedDate: String, days: Number }
 *
 * Rule-based delivery estimation. No external API required.
 * Gujarat pincodes (36xxxx) = 2 days, all others = 4 days.
 */
router.post('/estimate', async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit pincode.' });
    }

    const pin = String(pincode).trim();
    const gujaratPrefixes = ['36', '38', '39']; // Gujarat pincode ranges
    const isGujarat = gujaratPrefixes.some(prefix => pin.startsWith(prefix));

    const days = isGujarat ? 2 : 4;

    // Calculate delivery date (skip Sundays)
    const deliveryDate = new Date();
    let addedDays = 0;
    while (addedDays < days) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      if (deliveryDate.getDay() !== 0) { // 0 = Sunday
        addedDays++;
      }
    }

    const formatted = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    res.json({
      estimatedDate: formatted,
      days,
      pincode: pin
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not estimate delivery date.' });
  }
});

module.exports = router;
