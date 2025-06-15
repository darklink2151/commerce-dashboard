#!/bin/bash

echo "🚀 Setting up Warp for MCP Server File Access"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Check if warp-mcp-config.json exists
if [ ! -f "warp-mcp-config.json" ]; then
  echo -e "${RED}Error: warp-mcp-config.json file not found${NC}"
  exit 1
fi

# Ensure MCP directory exists
echo -e "${BLUE}Ensuring MCP directory exists...${NC}"
mkdir -p /var/www/mcp/commerce_dashboard

# Create a symlink to the products.json file
echo -e "${BLUE}Creating symlinks to important files...${NC}"
ln -sf /var/www/commerce-dashboard/data/products.json /var/www/mcp/commerce_dashboard/products.json

# Copy the MCP commands file if it exists, or create a new one
if [ -f "/var/www/commerce-dashboard/mcp_commands.md" ]; then
  cp /var/www/commerce-dashboard/mcp_commands.md /var/www/mcp/commerce_dashboard/
else
  echo -e "${YELLOW}Creating MCP commands file...${NC}"
  cat > /var/www/mcp/commerce_dashboard/mcp_commands.md << 'EOF'
# MCP Server Commands

## Server Management

```bash
# Check server status
pm2 status

# View server logs
pm2 logs commerce-dashboard

# Restart server
pm2 restart commerce-dashboard
```

## Product Management

```bash
# List products
cat /var/www/commerce-dashboard/data/products.json | jq '.[].name'

# Get product details
cat /var/www/commerce-dashboard/data/products.json | jq '.[] | select(.id=="cyber-shield-pro")'
```

## System Information

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check system uptime
uptime
```
EOF
fi

# Create product info file
echo -e "${BLUE}Creating product info file...${NC}"
cat > /var/www/mcp/commerce_dashboard/mcp_product_info.json << EOF
{
  "commerce_dashboard": {
    "url": "http://137.184.53.98",
    "api_endpoints": {
      "products": "http://137.184.53.98/api/products",
      "orders": "http://137.184.53.98/api/orders"
    },
    "dashboard_url": "http://137.184.53.98/dashboard",
    "store_url": "http://137.184.53.98",
    "last_updated": "$(date +"%Y-%m-%d %H:%M:%S")"
  }
}
EOF

# Set proper permissions
echo -e "${BLUE}Setting proper permissions...${NC}"
chmod -R 755 /var/www/mcp
chmod 644 /var/www/mcp/commerce_dashboard/*.json
chmod 644 /var/www/mcp/commerce_dashboard/*.md

# Stop Warp service if running
echo -e "${BLUE}Stopping Warp service...${NC}"
systemctl stop warp-svc

# Create directory for Warp configuration
mkdir -p /etc/cloudflare-warp

# Copy configuration file
echo -e "${BLUE}Applying Warp configuration...${NC}"
cp warp-mcp-config.json /etc/cloudflare-warp/config.json

# Set proper permissions
chmod 644 /etc/cloudflare-warp/config.json

# Start Warp service
echo -e "${BLUE}Starting Warp service...${NC}"
systemctl start warp-svc

# Wait for service to start
sleep 5

# Check if registration is needed
echo -e "${BLUE}Checking registration status...${NC}"
warp-cli status 2>&1 | grep -q "Registration missing"
if [ $? -eq 0 ]; then
  echo -e "${YELLOW}Registration needed. Registering with Cloudflare Warp...${NC}"
  echo -e "${YELLOW}You will need to accept the Terms of Service${NC}"
  echo -e "${YELLOW}Type 'y' when prompted${NC}"
  warp-cli --accept-tos registration new
fi

# Connect to Warp
echo -e "${BLUE}Connecting to Warp...${NC}"
warp-cli connect

# Check status
echo -e "${BLUE}Checking Warp status...${NC}"
warp-cli status

echo -e "${GREEN}✅ Warp MCP access setup complete!${NC}"
echo -e "${YELLOW}Your MCP files are accessible at:${NC}"
echo -e "${BLUE}/var/www/mcp/commerce_dashboard/${NC}"
echo -e "${YELLOW}If you lose SSH access, connect to the DigitalOcean console and run:${NC}"
echo -e "${BLUE}systemctl stop warp-svc && systemctl restart networking${NC}"
echo ""
echo -e "${GREEN}To disable Warp:${NC} warp-cli disconnect"
echo -e "${GREEN}To enable Warp:${NC} warp-cli connect" 