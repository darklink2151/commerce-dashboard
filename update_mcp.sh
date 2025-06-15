#!/bin/bash

echo "🚀 MCP Server Update Script"
echo "=========================="

# Configuration
MCP_SERVER_IP="137.184.53.98"  # Updated with your actual server IP
SSH_KEY="~/.ssh/id_ed25519_github"
REMOTE_DIR="/var/www/mcp"
LOCAL_PRODUCTS_FILE="data/products.json"
COMMERCE_DASHBOARD_URL="http://137.184.53.98"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MCP server IP is set
if [ "$MCP_SERVER_IP" == "YOUR_MCP_SERVER_IP" ]; then
  echo -e "${RED}Error: Please set your MCP server IP in the script${NC}"
  echo "Edit this script and replace YOUR_MCP_SERVER_IP with your actual server IP"
  exit 1
fi

# Check SSH connection
echo -e "${BLUE}Checking connection to MCP server...${NC}"
ssh -i $SSH_KEY -o ConnectTimeout=5 root@$MCP_SERVER_IP "echo Connected" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Cannot connect to MCP server${NC}"
  echo "Please check your SSH key and server IP"
  exit 1
fi
echo -e "${GREEN}Connection successful${NC}"

# Create product information for MCP
echo -e "${BLUE}Creating product information for MCP...${NC}"
cat > mcp_product_info.json <<EOF
{
  "commerce_dashboard": {
    "url": "$COMMERCE_DASHBOARD_URL",
    "api_endpoints": {
      "products": "$COMMERCE_DASHBOARD_URL/api/products",
      "orders": "$COMMERCE_DASHBOARD_URL/api/orders"
    },
    "dashboard_url": "$COMMERCE_DASHBOARD_URL/dashboard",
    "store_url": "$COMMERCE_DASHBOARD_URL",
    "last_updated": "$(date +"%Y-%m-%d %H:%M:%S")"
  }
}
EOF

# Create commands reference
echo -e "${BLUE}Creating commands reference...${NC}"
cat > mcp_commands.md <<EOF
# Commerce Dashboard Commands

## Server Management

\`\`\`bash
# Check server status
ssh -i $SSH_KEY root@137.184.53.98 "pm2 status"

# View server logs
ssh -i $SSH_KEY root@137.184.53.98 "pm2 logs commerce-dashboard"

# Restart server
ssh -i $SSH_KEY root@137.184.53.98 "pm2 restart commerce-dashboard"
\`\`\`

## Database Management

\`\`\`bash
# Update database with products
ssh -i $SSH_KEY root@137.184.53.98 "cd /var/www/commerce-dashboard && node update_database.js"

# Backup database
ssh -i $SSH_KEY root@137.184.53.98 "mongodump --db commerce-dashboard --out /root/backups/\$(date +%Y%m%d)"
\`\`\`

## Product Management

\`\`\`bash
# Upload new product files
scp -i $SSH_KEY /path/to/product.zip root@137.184.53.98:/var/www/commerce-dashboard/secure/

# Update products.json
scp -i $SSH_KEY data/products.json root@137.184.53.98:/var/www/commerce-dashboard/data/
\`\`\`

## Deployment

\`\`\`bash
# Update from GitHub
ssh -i $SSH_KEY root@137.184.53.98 "cd /var/www/commerce-dashboard && ./update.sh"

# Check server health
ssh -i $SSH_KEY root@137.184.53.98 "df -h && free -m && uptime"
\`\`\`
EOF

# Upload files to MCP server
echo -e "${BLUE}Uploading files to MCP server...${NC}"
ssh -i $SSH_KEY root@$MCP_SERVER_IP "mkdir -p $REMOTE_DIR/commerce_dashboard" > /dev/null 2>&1
scp -i $SSH_KEY mcp_product_info.json mcp_commands.md $LOCAL_PRODUCTS_FILE root@$MCP_SERVER_IP:$REMOTE_DIR/commerce_dashboard/ > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to upload files to MCP server${NC}"
  exit 1
fi

# Clean up local temporary files
rm -f mcp_product_info.json mcp_commands.md

echo -e "${GREEN}MCP server update complete!${NC}"
echo -e "${YELLOW}Files uploaded to $REMOTE_DIR/commerce_dashboard/ on MCP server${NC}"
echo -e "${BLUE}Product information, commands, and product data are now available on your MCP server${NC}" 