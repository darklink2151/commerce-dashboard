#!/bin/bash

echo "🚀 Setting up Cloudflare Warp with SSH preservation"
echo "=================================================="

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

# Install Cloudflare Warp if not already installed
if ! command -v warp-cli &> /dev/null; then
  echo -e "${BLUE}Installing Cloudflare Warp...${NC}"
  
  # Add Cloudflare GPG key
  curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
  
  # Add Cloudflare repository
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ focal main" | tee /etc/apt/sources.list.d/cloudflare-client.list
  
  # Install Warp
  apt-get update
  apt-get install -y cloudflare-warp
else
  echo -e "${GREEN}Cloudflare Warp is already installed${NC}"
fi

# Stop Warp service if running
echo -e "${BLUE}Stopping Warp service...${NC}"
systemctl stop warp-svc

# Create split tunnel configuration to preserve SSH access
echo -e "${BLUE}Creating split tunnel configuration...${NC}"

# Create directory for Warp configuration
mkdir -p /etc/cloudflare-warp

# Create Warp configuration file
cat > /etc/cloudflare-warp/config.json << EOF
{
  "tunnel": {
    "exclude_ips": [
      "0.0.0.0/0"
    ],
    "include_ips": [
      "104.16.0.0/12",
      "172.64.0.0/13"
    ],
    "exclude_hosts": [
      "localhost",
      "127.0.0.1"
    ],
    "include_hosts": [
      "*.cloudflare.com",
      "*.cloudflareclient.com"
    ],
    "protocol": "auto",
    "fallback_domains": []
  },
  "mode": "warp",
  "dns": {
    "upstream": [
      "1.1.1.1",
      "1.0.0.1"
    ],
    "fallback": [
      "8.8.8.8",
      "8.8.4.4"
    ]
  },
  "warp": {
    "start_on_launch": true,
    "always_on": false
  }
}
EOF

# Set proper permissions
chmod 644 /etc/cloudflare-warp/config.json

# Start Warp service
echo -e "${BLUE}Starting Warp service...${NC}"
systemctl start warp-svc

# Wait for service to start
sleep 5

# Register with Warp
echo -e "${YELLOW}Registering with Cloudflare Warp...${NC}"
echo -e "${YELLOW}You will need to accept the Terms of Service${NC}"
echo -e "${YELLOW}Type 'y' when prompted${NC}"
warp-cli --accept-tos registration new

# Configure tunnel settings
echo -e "${BLUE}Configuring tunnel settings...${NC}"
warp-cli tunnel ip exclude add 0.0.0.0/0
warp-cli tunnel ip include add 104.16.0.0/12
warp-cli tunnel ip include add 172.64.0.0/13

# Connect to Warp
echo -e "${BLUE}Connecting to Warp...${NC}"
warp-cli connect

# Check status
echo -e "${BLUE}Checking Warp status...${NC}"
warp-cli status

echo -e "${GREEN}✅ Warp setup complete!${NC}"
echo -e "${YELLOW}If you lose SSH access, connect to the DigitalOcean console and run:${NC}"
echo -e "${BLUE}systemctl stop warp-svc && systemctl restart networking${NC}"
echo ""
echo -e "${GREEN}To disable Warp:${NC} warp-cli disconnect"
echo -e "${GREEN}To enable Warp:${NC} warp-cli connect" 