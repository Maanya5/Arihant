const express = require('express');
const Cart = require('../models/Cart');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get cart for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        populate: [
          { path: 'standard_id', select: 'class_name gender division' },
          { path: 'school_id', select: 'name logo area city' }
        ]
      })
      .populate('items.variant');

    if (!cart) {
      cart = { user: req.user.id, items: [] };
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add item to cart (or update quantity)
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, variantId, size, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if product+size already in cart
    const existingIndex = cart.items.findIndex(
      ci => ci.product.toString() === productId && ci.size === size
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity || 1;
    } else {
      cart.items.push({ product: productId, variant: variantId, size, quantity: quantity || 1 });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:productId/:size', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(
      ci => !(ci.product.toString() === req.params.productId && ci.size === req.params.size)
    );

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
