#!/bin/bash

echo "🚀 Updating DigitalOcean server with enhanced monetization features..."

# Connect to the server and execute commands
ssh -i ~/.ssh/id_ed25519_github root@137.184.53.98 << 'EOF'
  cd /var/www/commerce-dashboard
  
  # Backup current files
  echo "📦 Creating backup of current files..."
  mkdir -p backups/$(date +%Y%m%d)
  cp -r public/css public/js server.js backups/$(date +%Y%m%d)/
  
  # Fetch the latest changes
  echo "📥 Fetching latest changes from GitHub..."
  git fetch origin
  
  # Pull the latest changes
  echo "🔄 Pulling latest changes..."
  git pull origin main
  
  # Install any new dependencies
  echo "📦 Installing dependencies..."
  npm install
  
  # Run the database update script to ensure products have isActive flag
  echo "🗃️ Updating database products..."
  node update_database.js
  
  # Restart the application
  echo "🔄 Restarting application..."
  pm2 restart commerce-dashboard
  
  echo "✅ Server updated successfully with monetization features!"
  echo "💰 Monetization features now live:"
  echo "   ✅ Smart Upselling & Cross-selling"
  echo "   ✅ Advanced Discount Code System"
  echo "   ✅ Multi-item Shopping Cart"
  echo "   ✅ Enhanced Product Search & Filtering"
  echo "   ✅ Analytics & Revenue Tracking"
EOF

echo "🌐 Your enhanced store is live at: http://137.184.53.98/"
echo "📊 Dashboard available at: http://137.184.53.98/dashboard"
echo "💰 Discount codes available:"
echo "   WELCOME10 - 10% off for new customers"
echo "   SAVE20 - 20% off orders over $50"
echo "   FLAT15 - $15 off orders over $30"
echo "   NEWUSER25 - 25% off for first-time buyers" 