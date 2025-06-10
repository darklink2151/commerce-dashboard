// Email templates for digital product delivery

class EmailTemplates {
  static getDigitalDeliveryTemplate(order, product, delivery) {
    return {
      subject: `Your ${product.name} - Digital Download Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Digital Product</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .download-box { background: white; border: 2px solid #4CAF50; padding: 20px; margin: 20px 0; text-align: center; }
            .download-button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .license-box { background: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Digital Product is Ready!</h1>
            </div>
            
            <div class="content">
              <h2>Thank you for your purchase!</h2>
              <p>Hi there,</p>
              <p>Your order for <strong>${product.name}</strong> has been processed successfully. Here are your download details:</p>
              
              <div class="download-box">
                <h3>📥 Download Your Product</h3>
                <p><strong>Product:</strong> ${product.name}</p>
                <p><strong>Order ID:</strong> ${order._id || order.id}</p>
                <a href="${delivery.downloadLink?.downloadUrl}" class="download-button">Download Now</a>
                <p><small>Download expires: ${delivery.downloadLink?.expiresAt ? new Date(delivery.downloadLink.expiresAt).toLocaleDateString() : 'N/A'}</small></p>
                <p><small>Downloads remaining: ${delivery.downloadLink?.downloadLimit || 'Unlimited'}</small></p>
              </div>
              
              ${delivery.license ? `
              <div class="license-box">
                <h3>🔑 Your License Key</h3>
                <p><strong>License:</strong> <code>${delivery.license.licenseKey}</code></p>
                <p><strong>Type:</strong> ${delivery.license.licenseType}</p>
                <p><strong>Valid Until:</strong> ${delivery.license.expiresAt ? new Date(delivery.license.expiresAt).toLocaleDateString() : 'Lifetime'}</p>
                <p><small>Please save this license key - you'll need it to activate your product.</small></p>
              </div>
              ` : ''}
              
              <div class="warning">
                <h4>⚠️ Important Information</h4>
                <ul>
                  <li>Download links are temporary and will expire</li>
                  <li>Please download your files immediately</li>
                  <li>Save your license key in a safe place</li>
                  <li>For support, reply to this email</li>
                </ul>
              </div>
              
              <h3>What's Next?</h3>
              <ol>
                <li>Click the download button above</li>
                <li>Save the downloaded files to your computer</li>
                <li>Use the license key during installation/activation</li>
                <li>Enjoy your new digital product!</li>
              </ol>
            </div>
            
            <div class="footer">
              <p>Questions? Contact us at support@yourstore.com</p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Your Digital Product is Ready!

Thank you for purchasing ${product.name}!

Download Link: ${delivery.downloadLink?.downloadUrl || 'N/A'}
Expires: ${delivery.downloadLink?.expiresAt ? new Date(delivery.downloadLink.expiresAt).toLocaleDateString() : 'N/A'}

${delivery.license ? `License Key: ${delivery.license.licenseKey}\nLicense Type: ${delivery.license.licenseType}\n` : ''}

Please download your files immediately as the link will expire.

For support, reply to this email.

Thank you for your business!
      `
    };
  }

  static getLicenseActivationTemplate(license, activation) {
    return {
      subject: 'License Activated Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🔓 License Activated</h2>
          <p>Your license has been successfully activated on a new device.</p>
          
          <div style="background: #f0f0f0; padding: 15px; margin: 20px 0;">
            <strong>License:</strong> ${license.licenseKey}<br>
            <strong>Device:</strong> ${activation.deviceInfo?.platform || 'Unknown'}<br>
            <strong>Activated:</strong> ${new Date().toLocaleString()}<br>
          </div>
          
          <p>If this wasn't you, please contact support immediately.</p>
        </div>
      `
    };
  }

  static getSubscriptionConfirmationTemplate(subscription, customer) {
    return {
      subject: 'Subscription Confirmed - Welcome!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎊 Welcome to Your Subscription!</h2>
          <p>Thank you for subscribing! Your subscription is now active.</p>
          
          <div style="background: #e8f5e8; padding: 15px; margin: 20px 0;">
            <strong>Subscription ID:</strong> ${subscription.id}<br>
            <strong>Status:</strong> ${subscription.status}<br>
            <strong>Next Billing:</strong> ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : 'N/A'}<br>
          </div>
          
          <p>You can manage your subscription at any time through your account dashboard.</p>
        </div>
      `
    };
  }
}

module.exports = EmailTemplates;

