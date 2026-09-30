const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One wishlist per user
  },
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on every save
wishlistSchema.pre('save', function () {
  this.updatedAt = new Date();
});


// Fast lookup of which users wishlisted a specific item
wishlistSchema.index({ 'items.item': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
