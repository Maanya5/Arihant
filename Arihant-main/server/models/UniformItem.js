const mongoose = require('mongoose');

const uniformItemSchema = new mongoose.Schema({
  standard: { type: mongoose.Schema.Types.ObjectId, ref: 'Standard', required: true },
  itemType: {
    type: String,
    enum: ['shirt', 'pant', 'skirt', 'socks', 'tie', 'belt', 'shorts', 'blazer'],
    required: true
  },
  uniformType: {
    type: String,
    enum: ['regular', 'sports', 'house'],
    default: 'regular'
  },
  itemName: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  sizes: [{
    size: { type: String, required: true },
    stock: { type: Number, default: 0 }
  }],
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UniformItem', uniformItemSchema);
