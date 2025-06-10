#!/bin/bash

# Setup script for digital delivery infrastructure

echo "🔧 Setting up Digital Delivery Infrastructure..."
echo "================================================"

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p uploads/digital-products
mkdir -p uploads/secure
mkdir -p logs
mkdir -p data/backup

# Set proper permissions for security
echo "🔒 Setting secure permissions..."
chmod 750 uploads/
chmod 700 uploads/secure/
chmod 755 uploads/digital-products/
chmod 755 logs/
chmod 755 data/backup/

# Create sample environment file if it doesn't exist
if [ ! -f .env ]; then
  echo "📋 Creating .env file from template..."
  cp env.example .env
  echo "⚠️  Please update .env with your actual configuration values!"
else
  echo "✅ .env file already exists"
fi

# Create sample digital products (empty files for testing)
echo "📦 Creating sample digital products..."
mkdir -p uploads/secure
touch uploads/secure/premium-software-v2.1.zip
touch uploads/secure/course-bundle-2024.zip
touch uploads/secure/basic-guide-ebook.pdf
touch uploads/secure/enterprise-suite-v3.0.zip

echo "✅ Digital delivery infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Run: npm run test (to test Stripe integration)"
echo "3. Run: node scripts/health-check.js (to verify setup)"
echo "4. Start the server: npm start"
echo ""
echo "🔐 Security reminders:"
echo "- Keep your .env file secure and never commit it"
echo "- Regularly backup your MongoDB database"
echo "- Monitor download logs for suspicious activity"
echo "- Use HTTPS in production"
echo "- Implement proper file access controls"

