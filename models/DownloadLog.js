const mongoose = require('mongoose');

const DownloadLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  downloadToken: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  },
  clientInfo: {
    ip: String,
    userAgent: String,
    platform: String,
    browser: String
  },
  downloadCount: {
    type: Number,
    default: 1
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient querying
DownloadLogSchema.index({ orderId: 1 });
DownloadLogSchema.index({ customerEmail: 1 });
DownloadLogSchema.index({ downloadToken: 1 });
DownloadLogSchema.index({ downloadedAt: -1 });

module.exports = mongoose.model('DownloadLog', DownloadLogSchema);

