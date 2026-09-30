const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  board: { type: String },
  logo: { type: String },
  banner: { type: String },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('School', schoolSchema);
