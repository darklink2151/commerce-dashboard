const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  // Digital Product Support
  type: {
    type: String,
    enum: ['physical', 'digital', 'subscription'],
    default: 'physical'
  },
  // Digital product metadata
  digitalMeta: {
    fileUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return this.type !== 'digital' || (v && v.length > 0);
        },
        message: 'Digital products must have a file URL'
      }
    },
    fileName: String,
    fileSize: Number,
    downloadLimit: {
      type: Number,
      default: 5
    },
    expirationDays: {
      type: Number,
      default: 30
    },
    licenseType: {
      type: String,
      enum: ['personal', 'commercial', 'enterprise'],
      default: 'personal'
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    requirements: [String],
    features: [String]
  },
  // Subscription metadata
  subscriptionMeta: {
    interval: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      validate: {
        validator: function(v) {
          return this.type !== 'subscription' || v;
        },
        message: 'Subscription products must have an interval'
      }
    },
    intervalCount: {
      type: Number,
      default: 1,
      min: 1
    },
    trialDays: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  inventory: {
    type: Number,
    default: -1 // -1 means unlimited for digital products
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

module.exports = mongoose.model('Product', ProductSchema); 