const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const OrderSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    enum: ['physical', 'digital', 'subscription'],
    default: 'physical'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  customerEmail: {
    type: String,
    required: false,
    match: /^\S+@\S+\.\S+$/
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'delivered'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  subscriptionId: {
    type: String // For subscription orders
  },
  // Digital delivery tracking
  digitalDelivery: {
    licenseKey: {
      type: String,
      default: () => uuidv4().replace(/-/g, '').toUpperCase()
    },
    downloadUrl: String,
    downloadCount: {
      type: Number,
      default: 0
    },
    downloadLimit: {
      type: Number,
      default: 5
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    deliveredAt: Date,
    accessToken: {
      type: String,
      default: () => uuidv4()
    }
  },
  // Billing information
  billing: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String
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

module.exports = mongoose.model('Order', OrderSchema); 