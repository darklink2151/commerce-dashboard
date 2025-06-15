#!/bin/bash

echo "🚀 Applying Cloudflare Warp MCP Configuration"
echo "==========================================="

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

# Check if warp-config.json exists
if [ ! -f "warp-config.json" ]; then
  echo -e "${RED}Error: warp-config.json file not found${NC}"
  exit 1
fi

# Stop Warp service if running
echo -e "${BLUE}Stopping Warp service...${NC}"
systemctl stop warp-svc

# Create directory for Warp configuration
mkdir -p /etc/cloudflare-warp

# Copy configuration file
echo -e "${BLUE}Applying Warp configuration...${NC}"
cp warp-config.json /etc/cloudflare-warp/config.json

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

echo -e "${GREEN}✅ Warp configuration applied!${NC}"
echo -e "${YELLOW}If you lose SSH access, connect to the DigitalOcean console and run:${NC}"
echo -e "${BLUE}systemctl stop warp-svc && systemctl restart networking${NC}"
echo ""
echo -e "${GREEN}To disable Warp:${NC} warp-cli disconnect"
echo -e "${GREEN}To enable Warp:${NC} warp-cli connect" 