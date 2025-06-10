# Digital Marketplace - Administrator Guide

## Table of Contents
1. [Overview](#overview)
2. [System Setup](#system-setup)
3. [Product Management](#product-management)
4. [Order Management](#order-management)
5. [Digital Delivery Configuration](#digital-delivery-configuration)
6. [License Management](#license-management)
7. [Security & Monitoring](#security--monitoring)
8. [Email Configuration](#email-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance Tasks](#maintenance-tasks)

## Overview

This digital marketplace supports three types of products:
- **Digital Products**: Software, ebooks, digital content with automated delivery
- **Physical Products**: Traditional e-commerce items requiring shipping
- **Subscriptions**: Recurring billing for services or content access

### Key Features
- Secure digital file delivery with access codes
- Automated license generation and validation
- Download monitoring and anti-piracy protection
- Comprehensive order tracking and analytics
- Email notifications and delivery

## System Setup

### Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure required variables:**
   ```env
   # Server
   PORT=3000
   NODE_ENV=production
   BASE_URL=https://your-domain.com
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/commerce-dashboard
   
   # Stripe (Use test keys for staging)
   STRIPE_SECRET_KEY=sk_live_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Email
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-business@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Your Business <noreply@yourdomain.com>
   
   # Digital Files
   DIGITAL_FILES_PATH=/secure/path/to/digital/files
   MAX_DOWNLOAD_ATTEMPTS=5
   DOWNLOAD_LINK_EXPIRY_HOURS=24
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

### Database Setup

The system automatically creates necessary collections on first run. For production:

1. **Enable MongoDB authentication**
2. **Set up regular backups**
3. **Configure replica set for high availability**

## Product Management

### Creating Digital Products

#### Via API (Recommended for bulk operations)

```javascript
// Example digital product creation
const product = {
  name: "Premium Software License",
  description: "Full-featured software with 1-year support",
  price: 99.99,
  type: "digital",
  isActive: true,
  digitalMeta: {
    fileUrl: "/secure/files/premium-software-v2.1.zip",
    fileName: "premium-software-v2.1.zip",
    fileSize: 157286400, // bytes
    licenseType: "standard", // standard, enterprise, personal
    downloadLimit: 3,
    requiresActivation: true
  },
  tags: ["software", "productivity", "premium"],
  category: "Software"
};

// POST to /api/admin/products
```

#### Digital Product Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Product display name |
| `description` | Yes | Product description |
| `price` | Yes | Price in USD |
| `type` | Yes | Must be "digital" |
| `digitalMeta.fileUrl` | Yes | Path to digital file |
| `digitalMeta.fileName` | Yes | Original filename |
| `digitalMeta.fileSize` | Yes | File size in bytes |
| `digitalMeta.licenseType` | No | License type (default: standard) |
| `digitalMeta.downloadLimit` | No | Max downloads (default: 5) |
| `digitalMeta.requiresActivation` | No | Requires license activation |

### Creating Physical Products

```javascript
const physicalProduct = {
  name: "Hardware Device",
  description: "Professional-grade hardware device",
  price: 299.99,
  type: "physical",
  isActive: true,
  inventory: {
    quantity: 50,
    sku: "HW-DEV-001",
    trackInventory: true
  },
  shipping: {
    weight: 2.5, // kg
    dimensions: {
      length: 25,
      width: 15,
      height: 10
    },
    requiresShipping: true
  }
};
```

### Creating Subscription Products

```javascript
const subscriptionProduct = {
  name: "Monthly Pro Plan",
  description: "Access to all premium features",
  price: 29.99,
  type: "subscription",
  isActive: true,
  subscriptionMeta: {
    interval: "month", // month, year
    intervalCount: 1,
    trialDays: 14,
    features: [
      "Unlimited downloads",
      "Priority support",
      "Advanced analytics"
    ]
  }
};
```

## Order Management

### Order Status Flow

1. **Pending**: Payment initiated but not confirmed
2. **Completed**: Payment successful, order processed
3. **Failed**: Payment failed or order processing error
4. **Refunded**: Order refunded
5. **Cancelled**: Order cancelled before completion

### Digital Order Processing

When a digital product order is completed:

1. **Order created** in database
2. **Digital delivery initiated** automatically
3. **Download token generated** with expiration
4. **License created** (if applicable)
5. **Email sent** with access code and download instructions
6. **Security monitoring** activated

### Manual Order Processing

For failed automated processing:

```javascript
// Manually trigger digital delivery
const DigitalDeliveryService = require('./services/DigitalDeliveryService');

const result = await DigitalDeliveryService.processDigitalDelivery(
  order,
  product,
  {
    forceWatermark: true,
    accessType: 'enterprise',
    customMessage: 'Special delivery for VIP customer'
  }
);
```

### Order Analytics

Access order analytics via:
- **Dashboard**: `/dashboard`
- **API**: `/api/stats`
- **Download logs**: `/api/security/downloads`

## Digital Delivery Configuration

### File Storage Setup

1. **Create secure directory:**
   ```bash
   mkdir -p /secure/digital-files
   chmod 700 /secure/digital-files
   ```

2. **Upload digital files:**
   ```bash
   # Organize by product category
   /secure/digital-files/
   ├── software/
   │   ├── app-v1.0.zip
   │   └── app-v2.0.zip
   ├── ebooks/
   │   ├── guide.pdf
   │   └── manual.pdf
   └── media/
       ├── video-course.mp4
       └── audio-book.mp3
   ```

3. **Set file permissions:**
   ```bash
   find /secure/digital-files -type f -exec chmod 600 {} \;
   ```

### Delivery Security Features

#### Access Codes
- Automatically generated 8-character codes
- Required for first download
- Sent via email to customer
- Single-use validation

#### Download Tokens
- 64-character secure tokens
- Configurable expiration (default: 24 hours)
- Download count limits
- IP tracking and validation

#### Watermarking
- Automatic for high-value products (>$50)
- Customer email embedded
- Purchase date and order ID
- Tamper detection

### Customizing Delivery Options

```javascript
// In product configuration
digitalMeta: {
  deliveryOptions: {
    enableWatermark: true,
    watermarkThreshold: 50, // USD
    maxDownloads: 5,
    linkExpiryHours: 48,
    requireAccessCode: true,
    enableTracking: true
  }
}
```

## License Management

### License Types

1. **Standard**: Basic usage rights
2. **Enterprise**: Multi-user, commercial use
3. **Personal**: Single-user, non-commercial
4. **Trial**: Limited-time evaluation

### License Generation

Licenses are automatically generated for digital products when:
- Product has `requiresActivation: true`
- Order is completed successfully
- Customer email is validated

### License Validation API

Customers validate licenses via:

```bash
POST /api/validate-license
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceId": "device-identifier",
  "deviceInfo": {
    "platform": "Windows 10",
    "version": "1.0.0"
  }
}
```

### Managing License Activations

```javascript
// Deactivate license from specific device
POST /api/license/deactivate
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceId": "device-to-remove"
}
```

### License Analytics

- View active licenses: `/api/security/licenses`
- Monitor activations: Check `activationCount` vs `maxActivations`
- Track suspicious activity: Review `securityFlags`

## Security & Monitoring

### Security Features

1. **Rate Limiting**
   - Download attempts: 10 per 15 minutes per IP
   - License validation: 50 per 15 minutes per IP
   - General API: 100 per 15 minutes per IP

2. **Anti-Piracy Detection**
   - VPN/Proxy detection
   - Bot detection
   - Concurrent download monitoring
   - Suspicious activity flagging

3. **Access Control**
   - Token-based downloads
   - Access code verification
   - IP whitelisting (optional)
   - Device fingerprinting

### Monitoring Dashboard

Access security information:

- **Download logs**: `/api/security/downloads`
- **Active tokens**: `/api/security/tokens`
- **License status**: `/api/security/licenses`
- **System health**: `/api/health`

### Responding to Security Threats

1. **Suspicious Download Activity**
   ```javascript
   // Revoke download token
   POST /api/security/revoke-token
   {
     "tokenId": "token-id-here",
     "reason": "Suspicious activity detected"
   }
   ```

2. **License Abuse**
   ```javascript
   // Suspend license
   const license = await License.findOne({ licenseKey });
   license.status = 'suspended';
   license.flagSecurity('Multiple activation attempts', 'abuse');
   await license.save();
   ```

3. **IP Blocking**
   - Configure firewall rules
   - Update rate limiting settings
   - Monitor security logs

## Email Configuration

### Supported Email Services

- Gmail (recommended for small businesses)
- Outlook/Hotmail
- Yahoo
- Custom SMTP servers
- SendGrid (for high volume)

### Gmail Setup

1. **Enable 2-Factor Authentication**
2. **Generate App Password**:
   - Google Account → Security → App passwords
   - Select "Mail" and your device
   - Use generated password in `EMAIL_PASS`

3. **Configuration:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-business@gmail.com
   EMAIL_PASS=generated-app-password
   EMAIL_FROM=Your Business <noreply@yourdomain.com>
   ```

### Custom SMTP Setup

```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
```

### Email Templates

Customize email templates in `/services/EmailDeliveryService.js`:

- Digital delivery emails
- License activation notifications
- Order confirmations
- Security alerts

## Troubleshooting

### Common Issues

#### Digital Delivery Not Working

1. **Check file permissions:**
   ```bash
   ls -la /secure/digital-files/
   # Should show read permissions for application user
   ```

2. **Verify file paths:**
   ```javascript
   // Check product.digitalMeta.fileUrl exists
   const fs = require('fs');
   console.log(fs.existsSync(product.digitalMeta.fileUrl));
   ```

3. **Test email delivery:**
   ```bash
   node -e "require('./services/EmailDeliveryService').testEmailConfig()"
   ```

#### Payment Processing Issues

1. **Verify Stripe configuration:**
   ```bash
   npm run test # Runs Stripe integration tests
   ```

2. **Check webhook endpoint:**
   - Stripe Dashboard → Webhooks
   - Verify endpoint URL: `https://yourdomain.com/webhook`
   - Test webhook delivery

3. **Webhook secret mismatch:**
   ```bash
   # Check webhook secret in Stripe Dashboard
   # Update STRIPE_WEBHOOK_SECRET in .env
   ```

#### Database Connection Issues

1. **Check MongoDB status:**
   ```bash
   sudo systemctl status mongod
   ```

2. **Test connection:**
   ```javascript
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('Connected'))
     .catch(err => console.error('Connection failed:', err));
   ```

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=commerce:*
```

### Log Files

Check application logs:

```bash
# Application logs
tail -f logs/application.log

# Error logs
tail -f logs/error.log

# Security logs
tail -f logs/security.log
```

## Maintenance Tasks

### Daily Tasks

1. **Monitor failed orders:**
   ```bash
   curl http://localhost:3000/api/orders?status=failed
   ```

2. **Check system health:**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Review security logs:**
   ```bash
   curl http://localhost:3000/api/security/downloads | jq '.summary'
   ```

### Weekly Tasks

1. **Clean expired tokens:**
   ```javascript
   // Automated cleanup runs daily, manual cleanup:
   const expiredTokens = await DownloadToken.find({
     expiresAt: { $lt: new Date() },
     isActive: true
   });
   
   for (const token of expiredTokens) {
     token.isActive = false;
     await token.save();
   }
   ```

2. **Database maintenance:**
   ```bash
   # Compact database
   mongo commerce-dashboard --eval "db.runCommand({compact: 'orders'})"
   ```

3. **Backup data:**
   ```bash
   mongodump --db commerce-dashboard --out /backup/$(date +%Y%m%d)
   ```

### Monthly Tasks

1. **Security audit:**
   - Review download patterns
   - Check for suspicious license usage
   - Update security settings

2. **Performance optimization:**
   - Analyze slow queries
   - Update database indexes
   - Clean old log files

3. **Update dependencies:**
   ```bash
   npm audit
   npm update
   ```

### Emergency Procedures

#### System Compromise

1. **Immediate actions:**
   - Disable all download tokens
   - Suspend suspicious licenses
   - Block suspicious IP addresses
   - Change all API keys

2. **Investigation:**
   - Review security logs
   - Check file access patterns
   - Analyze download statistics
   - Contact affected customers

3. **Recovery:**
   - Restore from clean backup
   - Re-issue licenses if necessary
   - Update security measures
   - Document incident

#### Data Loss

1. **Restore from backup:**
   ```bash
   mongorestore --db commerce-dashboard /backup/latest
   ```

2. **Verify data integrity:**
   - Check order counts
   - Validate product data
   - Test key functionality

3. **Communicate with customers:**
   - Send status updates
   - Re-issue download links if needed
   - Provide support contact

---

For additional support, contact the development team or refer to the [User Guide](USER_GUIDE.md) for customer-facing documentation.

