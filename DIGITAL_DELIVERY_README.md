# Secure Digital Delivery System

This document provides comprehensive documentation for the enhanced secure digital delivery mechanism implemented in the Commerce Dashboard.

## 🔐 Security Features Overview

### Core Security Components

1. **Expiring Download Links**
   - Cryptographically secure 64-character hex tokens
   - Configurable expiration times (default: 24 hours)
   - Automatic cleanup of expired tokens

2. **Email Delivery with Access Codes**
   - Unique 6-character access codes for each download
   - Beautiful HTML email templates with security warnings
   - Access code verification before download

3. **License Generation & Validation**
   - Secure license key generation with activation limits
   - Device-based activation tracking
   - License status management (active, suspended, expired, revoked)

4. **Digital Watermarking**
   - Automatic watermarking for high-value products (>$50)
   - Invisible digital signatures linking files to purchases
   - Watermark ID tracking in download logs

5. **Comprehensive Logging**
   - All download attempts logged with client information
   - IP address, browser, platform tracking
   - Success/failure tracking with error messages

6. **Anti-Piracy Measures**
   - Rate limiting (10 downloads per IP per 15 minutes)
   - Bot detection and blocking
   - VPN/Proxy usage detection
   - Concurrent download monitoring
   - Suspicious activity flagging

## 📁 File Structure

```
commerce-dashboard/
├── services/
│   ├── DigitalDeliveryService.js    # Core delivery logic
│   └── EmailDeliveryService.js      # Email delivery with templates
├── models/
│   ├── DownloadToken.js             # Secure token management
│   ├── DownloadLog.js               # Download attempt logging
│   └── License.js                   # License management
├── middleware/
│   └── security.js                  # Security & anti-piracy middleware
└── server.js                        # Enhanced main server with security
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Required Environment Variables

```env
# Essential for digital delivery
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MONGODB_URI=mongodb://localhost:27017/commerce-dashboard
```

### 3. Start the Server

```bash
npm install
npm run dev
```

## 🔧 API Endpoints

### Digital Delivery

#### Download File
```http
GET /api/download/:token?code=ACCESS_CODE
```

**Security Features:**
- Rate limited (10 requests per IP per 15 minutes)
- Access code verification required
- Bot detection and blocking
- IP logging and monitoring
- Download count tracking

**Response Examples:**

```json
// Success - File download starts
// Headers include watermark ID if applicable

// Error - Access code required
{
  "error": "Access code required for download",
  "code": "ACCESS_CODE_REQUIRED",
  "hint": "Check your email for the access code"
}

// Error - Download limit exceeded
{
  "error": "Download limit exceeded",
  "code": "TOKEN_INVALID"
}
```

#### License Validation
```http
POST /api/validate-license
```

**Request Body:**
```json
{
  "licenseKey": "ABCD-EFGH-IJKL-MNOP",
  "deviceId": "device-unique-identifier",
  "deviceInfo": {
    "platform": "Windows",
    "browser": "Chrome",
    "version": "1.0.0"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "licenseKey": "ABCD-EFGH-IJKL-MNOP",
  "licenseType": "commercial",
  "status": "active",
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "features": ["feature1", "feature2"],
  "activationCount": 2,
  "maxActivations": 5,
  "validatedAt": "2024-06-09T23:47:45.000Z"
}
```

### Security Monitoring

#### Get Download Logs
```http
GET /api/security/downloads
```

#### Get Active Tokens
```http
GET /api/security/tokens
```

#### Revoke Token
```http
POST /api/security/revoke-token
```
```json
{
  "tokenId": "token-mongodb-id",
  "reason": "Suspicious activity detected"
}
```

#### Get License Information
```http
GET /api/security/licenses
```

#### Download Statistics
```http
GET /api/downloads/stats/:orderId
```

## 🛡️ Security Implementation Details

### Rate Limiting

- **Download Endpoint**: 10 requests per IP per 15 minutes
- **License Validation**: 50 requests per IP per 5 minutes
- **Key Generation**: IP + User Agent hash for accuracy

### Access Token Security

- **Format**: 64-character hexadecimal strings
- **Generation**: Cryptographically secure random bytes
- **Storage**: Database with TTL indexes for automatic expiration
- **Validation**: Format checking and database lookup

### Anti-Piracy Detection

```javascript
// Bot Detection Patterns
const botPatterns = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /headless/i, /phantom/i, /selenium/i,
  /curl/i, /wget/i, /python/i
];

// Suspicious Activity Triggers
- Missing or short user agents (< 10 characters)
- Automated tool user agents
- Excessive downloads from single IP (> 5 in 15 minutes)
- Private IP addresses in production
- VPN/Proxy usage (configurable)
```

### Email Security

- **Access Codes**: 6-character cryptographically secure codes
- **Template Security**: HTML sanitization and XSS prevention
- **Delivery Tracking**: Email sent status and timestamps
- **License Attachments**: Secure license file generation

## 📊 Monitoring and Analytics

### Download Logs

Every download attempt is logged with:

- Customer email and order information
- IP address, browser, and platform
- Success/failure status
- Error messages and security flags
- Watermark IDs and access codes
- Timestamps and download counts

### Security Dashboard

Access security information at:
- `/api/security/downloads` - Download activity
- `/api/security/tokens` - Active download tokens
- `/api/security/licenses` - License status and activations

### Real-time Monitoring

Console logging provides real-time security insights:

```
✅ Authorized download: user@example.com - Product.zip
📊 Download count: 2/5
🚨 Suspicious request detected: Bot-like behavior
🔐 Access code verified: ABC123
🏴‍☠️ Potential piracy detected - excessive downloads from IP
```

## 🔄 Webhook Integration

The system automatically processes Stripe webhooks for:

1. **Payment Success** (`payment_intent.succeeded`)
   - Creates order record
   - Generates secure download tokens
   - Creates licenses for digital products
   - Sends delivery emails with access codes

2. **Subscription Payments** (`invoice.payment_succeeded`)
   - Renews access for subscription products

3. **Subscription Cancellation** (`customer.subscription.deleted`)
   - Revokes access to subscription content

## 🎨 Email Templates

The system includes beautiful, responsive HTML email templates featuring:

- Professional design with company branding
- Clear download instructions
- Prominent access codes
- Security warnings and anti-piracy notices
- License information display
- Watermark ID disclosure
- Support contact information

## 🔧 Configuration Options

### Digital Delivery Settings

```env
# Download link expiration (hours)
DOWNLOAD_LINK_EXPIRY_HOURS=24

# Maximum download attempts per token
MAX_DOWNLOAD_ATTEMPTS=5

# Watermark threshold (price in dollars)
WATERMARK_HIGH_VALUE_THRESHOLD=50

# Rate limiting
DOWNLOAD_RATE_LIMIT_MAX=10
LICENSE_RATE_LIMIT_MAX=50

# Anti-piracy
MAX_CONCURRENT_DOWNLOADS_PER_IP=5
ENABLE_VPN_DETECTION=true
ENABLE_BOT_DETECTION=true
```

### Product Configuration

For digital products, set these fields in the Product model:

```javascript
{
  type: 'digital',
  digitalMeta: {
    fileUrl: '/path/to/product/file.zip',
    fileName: 'MyProduct.zip',
    fileSize: 1048576, // bytes
    downloadLimit: 5,
    licenseType: 'commercial', // personal, commercial, enterprise
    maxActivations: 3,
    features: ['feature1', 'feature2']
  }
}
```

## 🚨 Security Best Practices

### File Storage

1. **Location**: Store files outside web root
2. **Permissions**: Restrict file system permissions
3. **Encryption**: Consider encrypting files at rest
4. **Backup**: Regular backups with encryption

### Database Security

1. **Connection**: Use encrypted MongoDB connections
2. **Authentication**: Enable MongoDB authentication
3. **Indexes**: TTL indexes for automatic cleanup
4. **Backup**: Regular encrypted backups

### Email Security

1. **App Passwords**: Use app-specific passwords for Gmail
2. **TLS**: Enforce TLS for email transmission
3. **Rate Limiting**: Prevent email abuse
4. **Content**: Sanitize all email content

### API Security

1. **HTTPS**: Always use HTTPS in production
2. **Headers**: Security headers (HSTS, CSP, etc.)
3. **Validation**: Input validation on all endpoints
4. **Logging**: Comprehensive security logging

## 🔍 Troubleshooting

### Common Issues

#### Email Not Sending
```
⚠️ Email service not configured. Digital delivery emails will be logged only.
```
**Solution**: Configure EMAIL_USER, EMAIL_PASS, and EMAIL_SERVICE in .env

#### Database Connection Issues
```
📄 Using fallback in-memory token validation (database unavailable)
```
**Solution**: Check MONGODB_URI and ensure MongoDB is running

#### Download Token Not Found
```
🚫 Download token not found in database
```
**Solution**: Token may have expired or been revoked. Check expiration and security flags.

#### Rate Limit Exceeded
```
🏴‍☠️ Potential piracy detected - excessive downloads from IP
```
**Solution**: Legitimate users should wait 15 minutes or contact support.

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
```

This provides comprehensive console output for debugging.

## 📈 Performance Considerations

### Scaling

1. **Redis**: Use Redis for token storage in production
2. **CDN**: Use CDN for file delivery
3. **Load Balancing**: Distribute traffic across multiple servers
4. **Database**: Use MongoDB replica sets

### File Delivery

1. **Streaming**: Files are streamed, not loaded into memory
2. **Caching**: Implement proper caching headers
3. **Compression**: Use gzip compression for smaller files
4. **Cloud Storage**: Consider AWS S3 or similar for file storage

## 🤝 Support and Maintenance

### Regular Tasks

1. **Token Cleanup**: Automatic via MongoDB TTL indexes
2. **Log Rotation**: Implement log rotation for large deployments
3. **Security Updates**: Regular dependency updates
4. **Monitoring**: Set up alerts for suspicious activity

### Maintenance Endpoints

- Health check: `GET /api/health`
- Statistics: `GET /api/stats`
- Security logs: `GET /api/security/downloads`

---

## 📝 License

This secure digital delivery system is part of the Enhanced Commerce Dashboard and follows the same licensing terms as the main project.

## 🔗 Related Documentation

- [Main README](./README.md)
- [API Documentation](./API.md)
- [Security Guide](./SECURITY.md)

---

*Last updated: June 2024*

