#!/bin/bash

# This script updates your DigitalOcean server from GitHub using a personal access token

echo "🔄 Updating DigitalOcean server..."

# Prompt for GitHub token
read -sp "Enter your GitHub token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: Token cannot be empty"
    exit 1
fi

# Connect to server and run update
ssh -i ~/.ssh/id_ed25519_github root@137.184.53.98 "cd /var/www/commerce-dashboard && \
git pull https://darklink2151:$GITHUB_TOKEN@github.com/darklink2151/commerce-dashboard.git main && \
pm2 restart commerce-dashboard"

echo "✅ Update complete!"
echo "🌐 Your site is live at: http://137.184.53.98/" 