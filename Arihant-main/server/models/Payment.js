const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  gatewayReferenceId: { type: String },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'Card', 'NetBanking', 'COD'], required: true },
  status:             { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  timestamp:          { type: Date, default: Date.now },
  refundId:           { type: String, default: null },
  refundStatus:       { type: String, enum: ['none', 'pending', 'processed'], default: 'none' }
});

module.exports = mongoose.model('Payment', paymentSchema);
