const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class EmailDeliveryService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        secure: true,
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      console.warn('⚠️  Email service not configured. Digital delivery emails will be logged only.');
    }
  }

  // Generate unique access code for email verification
  generateAccessCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  // Create secure email template for digital delivery
  createDigitalDeliveryTemplate(order, product, delivery, accessCode) {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Digital Purchase - ${product.name}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .download-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4CAF50; }
            .license-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2196F3; }
            .security-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #FF9800; }
            .btn { background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; font-weight: bold; }
            .access-code { font-size: 24px; font-weight: bold; background: #e8f5e8; padding: 15px; text-align: center; border-radius: 5px; letter-spacing: 3px; }
            .license-key { font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 3px; word-break: break-all; }
            .warning { color: #d32f2f; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
            .watermark-info { font-size: 12px; color: #666; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Thank You for Your Purchase!</h1>
            <p>Your digital product is ready for download</p>
        </div>
        
        <div class="content">
            <h2>Order Details</h2>
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Order ID:</strong> ${order._id || order.id}</p>
            <p><strong>Purchase Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> $${order.amount}</p>
            
            <div class="download-section">
                <h3>📥 Secure Download</h3>
                <p>Your download link is ready! This link is unique to your purchase and will expire in 24 hours.</p>
                
                <div class="access-code">
                    Access Code: ${accessCode}
                </div>
                
                <p><a href="${process.env.BASE_URL || 'http://localhost:3000'}${delivery.downloadLink.downloadUrl}" class="btn">Download Now</a></p>
                
                <p><strong>Download Information:</strong></p>
                <ul>
                    <li>Download attempts allowed: ${delivery.downloadLink.downloadLimit}</li>
                    <li>Link expires: ${delivery.downloadLink.expiresAt.toLocaleString()}</li>
                    <li>File size: ${this.formatFileSize(product.digitalMeta?.fileSize || 0)}</li>
                </ul>
            </div>
            
            ${delivery.license ? `
            <div class="license-section">
                <h3>🔑 License Information</h3>
                <p>Your license key for ${product.name}:</p>
                
                <div class="license-key">
                    ${delivery.license.licenseKey}
                </div>
                
                <p><strong>License Details:</strong></p>
                <ul>
                    <li>License Type: ${delivery.license.licenseType}</li>
                    <li>Maximum Activations: ${delivery.license.maxActivations || 'Unlimited'}</li>
                    <li>Valid Until: ${delivery.license.expiresAt ? new Date(delivery.license.expiresAt).toLocaleDateString() : 'Lifetime'}</li>
                    ${delivery.license.features && delivery.license.features.length > 0 ? `<li>Features: ${delivery.license.features.join(', ')}</li>` : ''}
                </ul>
            </div>
            ` : ''}
            
            <div class="security-section">
                <h3>🔒 Security & Anti-Piracy Notice</h3>
                <p class="warning">Important Security Information:</p>
                <ul>
                    <li>This download is licensed exclusively to: <strong>${order.customerEmail}</strong></li>
                    <li>Sharing, redistributing, or reselling this content is strictly prohibited</li>
                    <li>This file may contain digital watermarks linking it to your purchase</li>
                    <li>All downloads are logged and monitored for security purposes</li>
                </ul>
                
                ${delivery.watermark ? `
                <div class="watermark-info">
                    <p><strong>Digital Watermark ID:</strong> ${delivery.watermark.hash}</p>
                    <p>This file contains invisible digital watermarks that identify it as your licensed copy.</p>
                </div>
                ` : ''}
            </div>
            
            <h3>💡 Need Help?</h3>
            <p>If you experience any issues with your download or have questions about your license:</p>
            <ul>
                <li>Check your spam folder if you can't find this email</li>
                <li>Ensure you're using the correct access code: <strong>${accessCode}</strong></li>
                <li>Contact our support team with your Order ID: <strong>${order._id || order.id}</strong></li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${order.customerEmail} for Order #${order._id || order.id}</p>
            <p>For security reasons, please do not forward this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
    
    return template;
  }

  // Send digital delivery email with unique access code
  async sendDigitalDeliveryEmail(order, product, delivery) {
    try {
      const accessCode = this.generateAccessCode();
      
      // Store access code for verification (in production, use database)
      this.storeAccessCode(delivery.downloadLink.token, accessCode);
      
      const htmlContent = this.createDigitalDeliveryTemplate(order, product, delivery, accessCode);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: order.customerEmail,
        subject: `Your Digital Purchase: ${product.name} - Access Code: ${accessCode}`,
        html: htmlContent,
        attachments: delivery.license ? [
          {
            filename: 'license.txt',
            content: this.createLicenseFile(delivery.license, order, product)
          }
        ] : []
      };
      
      if (this.transporter) {
        const result = await this.transporter.sendMail(mailOptions);
        console.log(`✅ Digital delivery email sent to ${order.customerEmail}`);
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log(`🔐 Access Code: ${accessCode}`);
        return { success: true, messageId: result.messageId, accessCode };
      } else {
        // Log email content when transporter is not available
        console.log('📧 Digital delivery email (would be sent):');
        console.log(`To: ${order.customerEmail}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Access Code: ${accessCode}`);
        console.log(`License Key: ${delivery.license?.licenseKey}`);
        console.log(`Download URL: ${delivery.downloadLink?.downloadUrl}`);
        
        return { success: false, message: 'Email service not configured', accessCode };
      }
    } catch (error) {
      console.error('❌ Email delivery error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create license file content
  createLicenseFile(license, order, product) {
    return `
DIGITAL LICENSE AGREEMENT
========================

Product: ${product.name}
License Key: ${license.licenseKey}
License Type: ${license.licenseType}
Customer Email: ${order.customerEmail}
Order ID: ${order._id || order.id}
Purchase Date: ${new Date(order.createdAt).toISOString()}
Expires: ${license.expiresAt ? new Date(license.expiresAt).toISOString() : 'Never'}
Max Activations: ${license.maxActivations || 'Unlimited'}

Features:
${license.features && license.features.length > 0 ? license.features.map(f => `- ${f}`).join('\n') : '- All standard features included'}

IMPORTANT TERMS:
- This license is non-transferable and exclusive to the purchaser
- Sharing or redistributing this software is prohibited
- Support is provided for the duration of the license period
- This file contains your unique license information

For technical support or license questions, please contact support
with your Order ID: ${order._id || order.id}

Generated: ${new Date().toISOString()}
`;
  }

  // Store access code for later verification
  storeAccessCode(token, accessCode) {
    // In production, store this in Redis or database
    // For now, we'll add it to a simple in-memory store
    if (!this.accessCodes) {
      this.accessCodes = new Map();
    }
    
    this.accessCodes.set(token, {
      code: accessCode,
      createdAt: new Date(),
      used: false
    });
  }

  // Verify access code
  verifyAccessCode(token, providedCode) {
    if (!this.accessCodes) {
      return false;
    }
    
    const storedData = this.accessCodes.get(token);
    if (!storedData) {
      return false;
    }
    
    // Check if code matches and hasn't been used
    if (storedData.code === providedCode && !storedData.used) {
      storedData.used = true;
      return true;
    }
    
    return false;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Send license activation notification
  async sendLicenseActivationEmail(customerEmail, license, deviceInfo) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: customerEmail,
      subject: 'License Activation Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>License Activation Notification</h2>
          <p>Your license has been activated on a new device:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>License Key:</strong> ${license.licenseKey}<br>
            <strong>Device Platform:</strong> ${deviceInfo.platform || 'Unknown'}<br>
            <strong>Browser:</strong> ${deviceInfo.browser || 'Unknown'}<br>
            <strong>Activation Time:</strong> ${new Date().toLocaleString()}<br>
            <strong>Remaining Activations:</strong> ${license.maxActivations - license.activationCount}
          </div>
          
          <p>If this activation was not authorized by you, please contact support immediately.</p>
        </div>
      `
    };
    
    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        console.log(`🔑 License activation email sent to ${customerEmail}`);
      } catch (error) {
        console.error('License activation email error:', error);
      }
    }
  }
}

module.exports = new EmailDeliveryService();

