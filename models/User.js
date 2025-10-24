const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  shopifyStore: { type: String, required: true },
  shopifyAccessToken: { type: String, required: true },
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
