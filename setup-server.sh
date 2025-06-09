#!/bin/bash

SERVER_IP="137.184.53.98"
SSH_KEY="~/.ssh/id_ed25519_github"
REPO_URL=$(git remote get-url origin)

echo "🚀 Setting up server at $SERVER_IP"

# Copy deploy scripts to server
echo "📂 Copying deployment scripts..."
scp -i $SSH_KEY deploy.sh update.sh root@$SERVER_IP:/root/

# Connect to server and set up
echo "🔧 Setting up server..."
ssh -i $SSH_KEY root@$SERVER_IP << EOF
  # Create project directory
  mkdir -p /var/www/commerce-dashboard
  cd /var/www/commerce-dashboard

  # Clone repository
  git clone $REPO_URL .

  # Make scripts executable
  chmod +x /root/deploy.sh /root/update.sh

  # Run deployment script
  /root/deploy.sh

  echo "✅ Server setup complete!"
EOF

echo "🎉 Done! Your site should be live at http://$SERVER_IP/"
echo "📝 To update the site in the future:"
echo "1. Push changes to GitHub"
echo "2. SSH to the server: ssh -i $SSH_KEY root@$SERVER_IP"
echo "3. Run: cd /var/www/commerce-dashboard && /root/update.sh" 