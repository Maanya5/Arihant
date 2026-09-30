const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['bag', 'lunchbox', 'bottle', 'innerwear'],
    required: true
  },
  price_paisa: { type: Number, default: 0 },
  image_url: { type: String, default: null },
  is_active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Accessory', accessorySchema);
