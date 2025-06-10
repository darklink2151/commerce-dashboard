#!/bin/bash

SERVER_IP="137.184.53.98"
SSH_KEY="~/.ssh/id_ed25519_github"
REPO_URL="https://github.com/darklin2151/commerce-dashboard.git"

echo "🚀 Setting up server at $SERVER_IP"

# Create remote directory
echo "📂 Creating remote directory..."
ssh -i $SSH_KEY root@$SERVER_IP "mkdir -p /var/www/commerce-dashboard"

# Copy project files to server
echo "📂 Copying project files..."
scp -i $SSH_KEY -r * root@$SERVER_IP:/var/www/commerce-dashboard/

# Connect to server and set up
echo "🔧 Setting up server..."
ssh -i $SSH_KEY root@$SERVER_IP << EOF
  cd /var/www/commerce-dashboard
  
  # Initialize git repository for future updates
  git init
  git remote add origin $REPO_URL
  
  # Make scripts executable
  chmod +x deploy.sh update.sh
  
  # Run deployment script
  ./deploy.sh
  
  echo "✅ Server setup complete!"
EOF

echo "🎉 Done! Your site should be live at http://$SERVER_IP/"
echo "📝 To update the site in the future, you can either:"
echo "1. Run this script again to copy all files directly"
echo "2. Push to GitHub and run 'ssh -i $SSH_KEY root@$SERVER_IP \"cd /var/www/commerce-dashboard && ./update.sh\"'" 