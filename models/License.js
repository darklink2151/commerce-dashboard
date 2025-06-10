const mongoose = require('mongoose');
const crypto = require('crypto');

const LicenseSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  licenseKey: {
    type: String,
    required: true,
    unique: true
  },
  customerEmail: {
    type: String,
    required: true,
    match: /^\S+@\S+\.\S+$/
  },
  licenseType: {
    type: String,
    enum: ['personal', 'commercial', 'enterprise'],
    default: 'personal'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired', 'revoked'],
    default: 'active'
  },
  activationCount: {
    type: Number,
    default: 0
  },
  maxActivations: {
    type: Number,
    default: 3
  },
  activations: [{
    deviceId: String,
    deviceInfo: {
      platform: String,
      browser: String,
      ip: String
    },
    activatedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  },
  features: [String],
  metadata: {
    version: String,
    tier: String,
    customFields: mongoose.Schema.Types.Mixed
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

// Generate secure license key
LicenseSchema.statics.generateLicenseKey = function() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return segments.join('-');
};

// Check if license is valid
LicenseSchema.methods.isValid = function() {
  return this.status === 'active' && 
         this.expiresAt > new Date() &&
         this.activationCount <= this.maxActivations;
};

// Activate license on a device
LicenseSchema.methods.activate = function(deviceId, deviceInfo) {
  if (!this.isValid()) {
    throw new Error('License is not valid for activation');
  }

  // Check if device is already activated
  const existingActivation = this.activations.find(a => a.deviceId === deviceId && a.isActive);
  if (existingActivation) {
    return { success: true, message: 'Device already activated' };
  }

  // Check activation limit
  const activeActivations = this.activations.filter(a => a.isActive).length;
  if (activeActivations >= this.maxActivations) {
    throw new Error('Maximum activation limit reached');
  }

  // Add new activation
  this.activations.push({
    deviceId,
    deviceInfo,
    activatedAt: new Date(),
    isActive: true
  });

  this.activationCount = this.activations.filter(a => a.isActive).length;
  return { success: true, message: 'License activated successfully' };
};

// Deactivate license on a device
LicenseSchema.methods.deactivate = function(deviceId) {
  const activation = this.activations.find(a => a.deviceId === deviceId && a.isActive);
  if (activation) {
    activation.isActive = false;
    this.activationCount = this.activations.filter(a => a.isActive).length;
    return { success: true, message: 'License deactivated successfully' };
  }
  throw new Error('Device not found or already deactivated');
};

module.exports = mongoose.model('License', LicenseSchema);

