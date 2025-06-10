const mongoose = require('mongoose');
const crypto = require('crypto');

const DownloadTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
    required: true,
    match: /^\S+@\S+\.\S+$/
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  accessCode: {
    type: String,
    required: true
  },
  accessCodeUsed: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: {
    type: Number,
    default: 5
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  watermarkData: {
    id: String,
    hash: String,
    timestamp: String
  },
  accessType: {
    type: String,
    enum: ['standard', 'premium', 'enterprise'],
    default: 'standard'
  },
  clientInfo: {
    ip: String,
    userAgent: String,
    platform: String,
    browser: String,
    firstAccessedAt: Date,
    lastAccessedAt: Date
  },
  securityFlags: {
    suspiciousActivity: { type: Boolean, default: false },
    rateLimitExceeded: { type: Boolean, default: false },
    unauthorizedAccess: { type: Boolean, default: false },
    flaggedReason: String
  },
  deliveryMetadata: {
    deliveryId: String,
    licenseKey: String,
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate secure download token
DownloadTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Generate access code
DownloadTokenSchema.statics.generateAccessCode = function() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Check if token is valid for download
DownloadTokenSchema.methods.isValidForDownload = function() {
  return this.isActive && 
         new Date() <= this.expiresAt && 
         this.downloadCount < this.maxDownloads &&
         !this.securityFlags.suspiciousActivity;
};

// Record download attempt
DownloadTokenSchema.methods.recordDownload = function(clientInfo, success = true) {
  if (success) {
    this.downloadCount += 1;
  }
  
  this.clientInfo = {
    ...this.clientInfo,
    ...clientInfo,
    lastAccessedAt: new Date()
  };
  
  if (!this.clientInfo.firstAccessedAt) {
    this.clientInfo.firstAccessedAt = new Date();
  }
  
  this.updatedAt = new Date();
};

// Flag for security issues
DownloadTokenSchema.methods.flagSecurity = function(reason, flagType = 'suspiciousActivity') {
  this.securityFlags[flagType] = true;
  this.securityFlags.flaggedReason = reason;
  this.isActive = false; // Deactivate token for security
  this.updatedAt = new Date();
};

// Verify access code
DownloadTokenSchema.methods.verifyAccessCode = function(providedCode) {
  if (this.accessCodeUsed) {
    return false;
  }
  
  if (this.accessCode === providedCode) {
    this.accessCodeUsed = true;
    this.updatedAt = new Date();
    return true;
  }
  
  return false;
};

// Create indexes for efficient querying
DownloadTokenSchema.index({ customerEmail: 1 });
DownloadTokenSchema.index({ orderId: 1 });
DownloadTokenSchema.index({ productId: 1 });
DownloadTokenSchema.index({ createdAt: -1 });
DownloadTokenSchema.index({ expiresAt: 1 }); // For TTL
DownloadTokenSchema.index({ 'securityFlags.suspiciousActivity': 1 });

// Pre-save middleware to update timestamps
DownloadTokenSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('DownloadToken', DownloadTokenSchema);

