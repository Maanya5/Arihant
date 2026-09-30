const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
});


// Optimization: Automatic cleanup of abandoned carts after 30 days to save storage
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
