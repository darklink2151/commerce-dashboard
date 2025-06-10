// Security configuration for the commerce platform

const crypto = require('crypto');

class SecurityConfig {
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com;"
    };
  }

  static getRateLimitConfig() {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false
    };
  }

  static getDownloadRateLimit() {
    return {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit downloads to 10 per hour per IP
      message: {
        error: 'Too many download attempts',
        retryAfter: '1 hour'
      }
    };
  }

  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static hashSensitiveData(data, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  static verifySensitiveData(data, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>"'&]/g, (match) => {
        const escapeMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[match];
      })
      .trim();
  }

  static validateLicenseKey(licenseKey) {
    // Validate license key format (e.g., XXXX-XXXX-XXXX-XXXX)
    const licenseRegex = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
    return licenseRegex.test(licenseKey);
  }

  static generateDownloadSignature(orderId, productId, timestamp, secret) {
    const data = `${orderId}:${productId}:${timestamp}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  static verifyDownloadSignature(orderId, productId, timestamp, signature, secret) {
    const expectedSignature = this.generateDownloadSignature(orderId, productId, timestamp, secret);
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  }
}

module.exports = SecurityConfig;

