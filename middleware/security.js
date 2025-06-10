const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const mongoose = require('mongoose');
const DownloadLog = require('../models/DownloadLog');

// Rate limiting for downloads
const downloadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 downloads per IP per window
  message: {
    error: 'Too many download attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + user agent combination for more accurate limiting
    return crypto.createHash('sha256')
      .update(req.ip + (req.get('User-Agent') || ''))
      .digest('hex');
  }
});

// Rate limiting for license validation
const licenseRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Max 50 license validations per IP per window
  message: {
    error: 'Too many license validation attempts. Please try again later.',
    retryAfter: '5 minutes'
  }
});

// IP logging and monitoring middleware
const ipLogger = (req, res, next) => {
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    platform: getPlatform(req.get('User-Agent')),
    browser: getBrowser(req.get('User-Agent')),
    timestamp: new Date(),
    endpoint: req.path,
    method: req.method,
    headers: {
      referer: req.get('Referer'),
      acceptLanguage: req.get('Accept-Language'),
      acceptEncoding: req.get('Accept-Encoding')
    }
  };
  
  // Attach client info to request for later use
  req.clientInfo = clientInfo;
  
  // Log suspicious patterns
  if (isSuspiciousRequest(req)) {
    console.warn('🚨 Suspicious request detected:', {
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      endpoint: req.path,
      reason: getSuspiciousReason(req)
    });
    
    // Add security flag to request
    req.securityFlags = {
      suspicious: true,
      reason: getSuspiciousReason(req)
    };
  }
  
  next();
};

// Access token validation middleware
const validateAccessToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    const accessCode = req.query.code || req.headers['x-access-code'];
    
    if (!token) {
      return res.status(400).json({ error: 'Download token is required' });
    }
    
    // Basic token format validation
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    
    req.downloadToken = token;
    req.accessCode = accessCode;
    next();
  } catch (error) {
    console.error('Access token validation error:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
};

// Anti-piracy detection middleware
const antiPiracyCheck = async (req, res, next) => {
  try {
    const { ip, userAgent } = req.clientInfo;
    
    // Check for concurrent downloads from same IP
    const recentDownloads = await checkRecentDownloads(ip);
    if (recentDownloads.count > 5) {
      console.warn('🏴‍☠️ Potential piracy detected - excessive downloads from IP:', ip);
      return res.status(429).json({ 
        error: 'Excessive download activity detected. Please contact support.',
        code: 'PIRACY_DETECTED'
      });
    }
    
    // Check for bot-like behavior
    if (isBotLike(userAgent)) {
      console.warn('🤖 Bot-like behavior detected:', { ip, userAgent });
      return res.status(403).json({ 
        error: 'Automated access detected. Please use a regular browser.',
        code: 'BOT_DETECTED'
      });
    }
    
    // Check for VPN/Proxy usage (basic detection)
    if (await isVpnOrProxy(ip)) {
      console.warn('🔍 VPN/Proxy usage detected:', ip);
      // Log but don't block (many legitimate users use VPNs)
      req.securityFlags = {
        ...req.securityFlags,
        vpnDetected: true
      };
    }
    
    next();
  } catch (error) {
    console.error('Anti-piracy check error:', error);
    next(); // Don't block on error
  }
};

// License activation security middleware
const licenseSecurityCheck = async (req, res, next) => {
  try {
    const { licenseKey, deviceId } = req.body;
    const { ip } = req.clientInfo;
    
    // Check for rapid activation attempts
    const recentActivations = await checkRecentActivations(licenseKey, ip);
    if (recentActivations > 3) {
      console.warn('🔑 Suspicious license activation pattern:', { licenseKey, ip });
      return res.status(429).json({ 
        error: 'Too many activation attempts. Please try again later.',
        code: 'ACTIVATION_RATE_LIMIT'
      });
    }
    
    // Validate device ID format
    if (deviceId && !/^[a-zA-Z0-9-_]{10,}$/.test(deviceId)) {
      return res.status(400).json({ 
        error: 'Invalid device ID format',
        code: 'INVALID_DEVICE_ID'
      });
    }
    
    next();
  } catch (error) {
    console.error('License security check error:', error);
    next();
  }
};

// Helper functions
function getPlatform(userAgent) {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getBrowser(userAgent) {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
}

function isSuspiciousRequest(req) {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip;
  
  // Check for missing or suspicious user agents
  if (!userAgent || userAgent.length < 10) return true;
  
  // Check for automated tools
  const suspiciousAgents = ['curl', 'wget', 'python', 'bot', 'crawler', 'spider'];
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return true;
  }
  
  // Check for localhost or private IPs in production
  if (process.env.NODE_ENV === 'production' && isPrivateIP(ip)) {
    return true;
  }
  
  return false;
}

function getSuspiciousReason(req) {
  const userAgent = req.get('User-Agent') || '';
  
  if (!userAgent || userAgent.length < 10) return 'Missing or short user agent';
  
  const suspiciousAgents = ['curl', 'wget', 'python', 'bot', 'crawler', 'spider'];
  const found = suspiciousAgents.find(agent => userAgent.toLowerCase().includes(agent));
  if (found) return `Automated tool detected: ${found}`;
  
  if (process.env.NODE_ENV === 'production' && isPrivateIP(req.ip)) {
    return 'Private IP in production';
  }
  
  return 'Unknown suspicious pattern';
}

function isPrivateIP(ip) {
  const privateRanges = [
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^127\./,
    /^localhost$/
  ];
  
  return privateRanges.some(range => range.test(ip));
}

function isBotLike(userAgent) {
  if (!userAgent) return true;
  
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
    /curl/i,
    /wget/i,
    /python/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

async function checkRecentDownloads(ip) {
  try {
    if (mongoose.connection.readyState === 1) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const count = await DownloadLog.countDocuments({
        'clientInfo.ip': ip,
        downloadedAt: { $gte: fifteenMinutesAgo }
      });
      return { count, timeWindow: '15 minutes' };
    }
  } catch (error) {
    console.error('Error checking recent downloads:', error);
  }
  return { count: 0, timeWindow: '15 minutes' };
}

async function checkRecentActivations(licenseKey, ip) {
  // This would check recent license activations in a real implementation
  // For now, return 0 to avoid blocking
  return 0;
}

async function isVpnOrProxy(ip) {
  // Basic VPN/Proxy detection
  // In production, you might use a service like IPQualityScore or similar
  
  // Common VPN/Proxy indicators
  const vpnIndicators = [
    /^10\./,        // Private range often used by VPNs
    /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Private range
    /^192\.168\./   // Private range
  ];
  
  // This is a very basic check - real implementation would use external services
  return vpnIndicators.some(pattern => pattern.test(ip));
}

module.exports = {
  downloadRateLimit,
  licenseRateLimit,
  ipLogger,
  validateAccessToken,
  antiPiracyCheck,
  licenseSecurityCheck
};

