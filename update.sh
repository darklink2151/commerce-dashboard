#!/bin/bash

echo "🔄 Commerce Dashboard Update Script"
echo "=================================="

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Restart the application
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart commerce-dashboard 2>/dev/null || pm2 start server.js --name "commerce-dashboard"
else
    echo "⚠️ PM2 not found, please run deploy.sh first."
    exit 1
fi

echo "✅ Update complete!"
echo "🌐 Your site is live at: http://$(curl -s ifconfig.me)/" 