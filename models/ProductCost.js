const mongoose = require('mongoose');

const productCostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopifyProductId: { type: String, required: true },
  productName: String,
  cost: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});

productCostSchema.index({ userId: 1, shopifyProductId: 1 }, { unique: true });

module.exports = mongoose.model('ProductCost', productCostSchema);
