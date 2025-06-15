#!/bin/bash

echo "🔄 Updating DigitalOcean server..."

# Connect to the server and execute commands
ssh -i ~/.ssh/id_ed25519_github root@137.184.53.98 << 'EOF'
  cd /var/www/commerce-dashboard
  
  # Backup current CSS file
  cp public/css/style.css public/css/style.css.bak
  
  # Fetch the latest changes
  git fetch origin
  
  # Update specific files instead of trying to switch branches
  git checkout origin/main -- public/css/style.css
  
  # Restart the application
  pm2 restart commerce-dashboard
  
  echo "✅ Server updated successfully!"
EOF

echo "🌐 Your site is live at: http://137.184.53.98/" 