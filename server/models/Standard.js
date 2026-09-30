const mongoose = require('mongoose');

const standardSchema = new mongoose.Schema({
  school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  class_name: { type: String, required: true },
  gender: { type: String, enum: ['boy', 'girl'], required: true },
  division: { type: String, enum: ['primary', 'secondary', 'higher'], required: true },
  is_active: { type: Boolean, default: true }
});

// Compound index to prevent duplicate class+gender per school
// Optimization: Prevents duplicate standard definitions and optimizes school catalogue filtering
standardSchema.index({ school_id: 1, class_name: 1, gender: 1 }, { unique: true });

module.exports = mongoose.model('SchoolStandard', standardSchema);
