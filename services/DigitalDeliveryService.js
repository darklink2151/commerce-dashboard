const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const License = require('../models/License');
const DownloadLog = require('../models/DownloadLog');

class DigitalDeliveryService {
  constructor() {
    this.downloadTokens = new Map(); // In-memory store for download tokens
    this.rateLimiter = new Map(); // Rate limiting per IP
  }

  // Generate secure download token with metadata
  generateDownloadToken(order, product, options = {}) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (options.expirationHours || 24) * 60 * 60 * 1000);
    
    const tokenData = {
      token,
      orderId: order._id || order.id,
      productId: product._id || product.id,
      customerEmail: order.customerEmail,
      fileName: product.digitalMeta?.fileName || `${product.name}.zip`,
      fileUrl: product.digitalMeta?.fileUrl,
      fileSize: product.digitalMeta?.fileSize || 0,
      expiresAt,
      downloadCount: 0,
      maxDownloads: product.digitalMeta?.downloadLimit || 5,
      createdAt: new Date(),
      accessType: options.accessType || 'standard',
      watermarkData: options.watermark || null
    };
    
    // Store token (in production, use Redis or database)
    this.downloadTokens.set(token, tokenData);
    
    // Clean up expired tokens periodically
    this.cleanupExpiredTokens();
    
    return {
      downloadUrl: `/api/download/${token}`,
      token,
      expiresAt,
      downloadLimit: tokenData.maxDownloads
    };
  }

  // Validate download token and check permissions
  async validateDownloadToken(token, clientInfo = {}) {
    const tokenData = this.downloadTokens.get(token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired download token');
    }
    
    // Check expiration
    if (new Date() > tokenData.expiresAt) {
      this.downloadTokens.delete(token);
      throw new Error('Download link has expired');
    }
    
    // Check download limits
    if (tokenData.downloadCount >= tokenData.maxDownloads) {
      throw new Error('Download limit exceeded');
    }
    
    // Rate limiting check
    const clientKey = clientInfo.ip || 'unknown';
    if (this.isRateLimited(clientKey)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    return tokenData;
  }

  // Generate license with advanced features
  async generateLicense(order, product, options = {}) {
    try {
      if (mongoose.connection.readyState === 1) {
        const license = new License({
          orderId: order._id,
          productId: product._id || product.id,
          licenseKey: License.generateLicenseKey(),
          customerEmail: order.customerEmail,
          licenseType: product.digitalMeta?.licenseType || 'personal',
          maxActivations: product.digitalMeta?.maxActivations || 3,
          features: product.digitalMeta?.features || [],
          metadata: {
            version: product.digitalMeta?.version || '1.0.0',
            tier: options.tier || 'standard',
            customFields: {
              orderDate: order.createdAt,
              productName: product.name,
              watermarkId: options.watermarkId || null
            }
          }
        });
        
        await license.save();
        return license;
      }
    } catch (error) {
      console.error('License generation error:', error);
    }
    
    // Fallback license generation
    return {
      licenseKey: this.generateFallbackLicenseKey(),
      customerEmail: order.customerEmail,
      licenseType: product.digitalMeta?.licenseType || 'personal',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      features: product.digitalMeta?.features || []
    };
  }

  // Generate watermark for digital files
  generateWatermark(order, product) {
    const watermarkData = {
      id: crypto.randomUUID(),
      customerEmail: order.customerEmail,
      orderId: order._id || order.id,
      productId: product._id || product.id,
      timestamp: new Date().toISOString(),
      hash: crypto.createHash('sha256')
        .update(`${order.customerEmail}-${order._id || order.id}-${Date.now()}`)
        .digest('hex').substring(0, 16)
    };
    
    return watermarkData;
  }

  // Process complete digital delivery
  async processDigitalDelivery(order, product, options = {}) {
    const deliveryResult = {
      downloadLink: null,
      license: null,
      watermark: null,
      success: false,
      deliveryId: crypto.randomUUID()
    };
    
    try {
      if (product.type === 'digital') {
        // Generate watermark for high-value products
        if (product.price > 50 || options.forceWatermark) {
          deliveryResult.watermark = this.generateWatermark(order, product);
        }
        
        // Create secure download link
        deliveryResult.downloadLink = this.generateDownloadToken(order, product, {
          watermark: deliveryResult.watermark,
          accessType: options.accessType || 'standard'
        });
        
        // Generate license
        deliveryResult.license = await this.generateLicense(order, product, {
          watermarkId: deliveryResult.watermark?.id,
          tier: options.tier
        });
        
        deliveryResult.success = true;
        
        // Log successful delivery
        await this.logDelivery(order, product, deliveryResult);
      }
      
      return deliveryResult;
    } catch (error) {
      console.error('Digital delivery error:', error);
      await this.logDelivery(order, product, deliveryResult, error.message);
      return deliveryResult;
    }
  }

  // Log delivery attempts and downloads
  async logDelivery(order, product, delivery, errorMessage = null) {
    try {
      if (mongoose.connection.readyState === 1) {
        const log = new DownloadLog({
          orderId: order._id,
          productId: product._id || product.id,
          customerEmail: order.customerEmail,
          downloadToken: delivery.downloadLink?.token || null,
          fileName: product.digitalMeta?.fileName || `${product.name}.zip`,
          fileSize: product.digitalMeta?.fileSize || 0,
          downloadedAt: new Date(),
          success: !errorMessage,
          errorMessage,
          clientInfo: {
            deliveryId: delivery.deliveryId,
            watermarkId: delivery.watermark?.id || null,
            licenseKey: delivery.license?.licenseKey || null
          }
        });
        
        await log.save();
      }
    } catch (error) {
      console.error('Delivery logging error:', error);
    }
  }

  // Rate limiting implementation
  isRateLimited(clientKey) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 10; // Max 10 downloads per IP per 15 minutes
    
    if (!this.rateLimiter.has(clientKey)) {
      this.rateLimiter.set(clientKey, { count: 1, resetTime: now + windowMs });
      return false;
    }
    
    const clientData = this.rateLimiter.get(clientKey);
    
    if (now > clientData.resetTime) {
      // Reset window
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      return false;
    }
    
    if (clientData.count >= maxRequests) {
      return true;
    }
    
    clientData.count++;
    return false;
  }

  // Increment download count for token
  incrementDownloadCount(token) {
    const tokenData = this.downloadTokens.get(token);
    if (tokenData) {
      tokenData.downloadCount++;
    }
  }

  // Clean up expired tokens
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of this.downloadTokens.entries()) {
      if (now > data.expiresAt) {
        this.downloadTokens.delete(token);
      }
    }
  }

  // Generate fallback license key
  generateFallbackLicenseKey() {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return segments.join('-');
  }

  // Get download statistics
  getDownloadStats(orderId) {
    const stats = {
      totalDownloads: 0,
      uniqueTokens: 0,
      activeTokens: 0,
      expiredTokens: 0
    };
    
    for (const [token, data] of this.downloadTokens.entries()) {
      if (data.orderId === orderId) {
        stats.uniqueTokens++;
        stats.totalDownloads += data.downloadCount;
        
        if (new Date() > data.expiresAt) {
          stats.expiredTokens++;
        } else {
          stats.activeTokens++;
        }
      }
    }
    
    return stats;
  }
}

module.exports = new DigitalDeliveryService();

