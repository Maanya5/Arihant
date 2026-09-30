const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  phone:    { type: String, required: true, trim: true },
  email:    { type: String, trim: true, lowercase: true },
  school:   { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  item:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true, min: 1 },
  message:  { type: String, trim: true },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new'
  },
  createdAt: { type: Date, default: Date.now }
});

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ school: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
