const express = require('express');
const { auth } = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const wishlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many wishlist requests. Please wait.' }
});

/**
 * GET /api/wishlist
 * Returns the user's wishlist with fully populated product data
 */
router.get('/', auth, wishlistLimiter, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'items.item',
        select: 'name item_type price_paisa mrp_paisa primary_image school_id standard_id is_active itemSlug',
        populate: [
          { path: 'school_id', select: 'name city' },
          { path: 'standard_id', select: 'class_name gender' }
        ]
      })
      .lean();

    if (!wishlist) return res.json({ items: [] });

    // Filter out deleted products
    wishlist.items = wishlist.items.filter(i => i.item && i.item.is_active !== false);

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch wishlist.' });
  }
});

/**
 * POST /api/wishlist
 * Body: { itemId: ObjectId }
 * Adds an item to the wishlist (idempotent)
 */
router.post('/', auth, wishlistLimiter, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      {
        $addToSet: { items: { item: itemId } }, // addToSet prevents duplicates
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Added to wishlist.', count: wishlist.items.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to wishlist.' });
  }
});

/**
 * DELETE /api/wishlist/:itemId
 * Removes a specific item from the wishlist
 */
router.delete('/:itemId', auth, wishlistLimiter, async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      {
        $pull: { items: { item: new mongoose.Types.ObjectId(itemId) } },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found.' });
    res.json({ message: 'Removed from wishlist.', count: wishlist.items.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove from wishlist.' });
  }
});

module.exports = router;
