const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  size: { type: String, required: true },
  stock_qty: { type: Number, default: 0 },
  is_available: { type: Boolean, default: true }
});

// Compound index to prevent duplicate size per product
// Optimization: Enforces data integrity (no duplicate sizes) and speeds up SKU-level lookups
productVariantSchema.index({ product_id: 1, size: 1 }, { unique: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
