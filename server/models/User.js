const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String },
  // password is optional — Google SSO users don't have one
  password: { type: String, required: false },
  // Firebase user ID — populated for Google SSO sign-ins
  firebaseUid: { type: String, sparse: true, unique: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  image: { type: String },
  provider: { type: String, default: 'local' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
