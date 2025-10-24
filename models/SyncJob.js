const mongoose = require('mongoose');

const syncJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  recordsSynced: { type: Number, default: 0 },
  errors: [String],
  createdAt: { type: Date, default: Date.now }
});

syncJobSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SyncJob', syncJobSchema);
