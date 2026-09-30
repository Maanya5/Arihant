const express = require('express');
const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many inquiry submissions. Please try again later.' }
});

const inquiryRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
];

/**
 * POST /api/inquiries
 * Bulk order inquiry from PDP modal
 */
router.post('/', inquiryLimiter, inquiryRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { name, phone, email, school, item, quantity, message } = req.body;

    const inquiry = await Inquiry.create({
      name,
      phone,
      email,
      school: mongoose.Types.ObjectId.isValid(school) ? school : undefined,
      item:   mongoose.Types.ObjectId.isValid(item) ? item : undefined,
      quantity,
      message
    });

    // Fire-and-forget email to admin
    const { sendBulkInquiryEmail } = require('../services/emailService');
    sendBulkInquiryEmail(inquiry).catch(e =>
      console.error('[Inquiry] Email failed:', e.message)
    );

    res.status(201).json({ message: 'Inquiry submitted. Our team will contact you within 24 hours.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit inquiry. Please try again.' });
  }
});

module.exports = router;
