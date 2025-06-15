#!/bin/bash

# This script should be placed on the server and run there
# Replace GITHUB_TOKEN with your actual GitHub token

GITHUB_TOKEN="YOUR_GITHUB_TOKEN"

echo "🔄 Updating from GitHub..."
cd /var/www/commerce-dashboard

# Set remote URL with token
git remote set-url origin https://darklink2151:${GITHUB_TOKEN}@github.com/darklink2151/commerce-dashboard.git

# Pull latest changes
git pull

# Reset remote URL to plain HTTPS to avoid token exposure in .git/config
git remote set-url origin https://github.com/darklink2151/commerce-dashboard.git

# Restart the application
pm2 restart commerce-dashboard

echo "✅ Update complete!"
echo "🌐 Your site is live at: http://137.184.53.98/" 