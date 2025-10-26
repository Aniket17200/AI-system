const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  googleAuth: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  shopifyStore: String,
  shopifyAccessToken: String,
  metaAccessToken: String,
  metaAdAccountId: String,
  shiprocketEmail: String,
  shiprocketPassword: String,
  shiprocketToken: String,
  isActive: { type: Boolean, default: true },
  lastSyncAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
