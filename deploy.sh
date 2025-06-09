#!/bin/bash

echo "🚀 Commerce Dashboard Deployment Script"
echo "======================================="

# Check if we're on a DigitalOcean droplet or local machine
if [ -f /etc/digitalocean ]; then
    echo "✅ Detected DigitalOcean environment"
    IS_DIGITALOCEAN=true
else
    echo "📱 Local environment detected"
    IS_DIGITALOCEAN=false
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    if $IS_DIGITALOCEAN; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Please install Node.js manually: https://nodejs.org/"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Check for environment file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Please create one based on env.example"
    echo "📋 Example .env content:"
    cat env.example
    echo ""
    echo "💡 After creating .env, run this script again"
    exit 1
fi

# Production setup
if $IS_DIGITALOCEAN; then
    echo "🌐 Setting up production environment..."
    
    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Start the application
    echo "🚀 Starting application with PM2..."
    pm2 stop commerce-dashboard 2>/dev/null || true
    pm2 start server.js --name "commerce-dashboard"
    pm2 startup
    pm2 save
    
    # Install and setup Nginx if not present
    if ! command -v nginx &> /dev/null; then
        echo "📦 Installing Nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
        
        # Create Nginx configuration
        sudo tee /etc/nginx/sites-available/commerce-dashboard > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        
        # Enable the site
        sudo ln -sf /etc/nginx/sites-available/commerce-dashboard /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl restart nginx
    fi
    
    echo "🎉 Deployment complete!"
    echo "📊 Dashboard: http://$(curl -s ifconfig.me)/dashboard"
    echo "🛍️  Store: http://$(curl -s ifconfig.me)/"
    echo "📝 Logs: pm2 logs commerce-dashboard"
    
else
    # Local development
    echo "💻 Starting local development server..."
    npm start
fi 