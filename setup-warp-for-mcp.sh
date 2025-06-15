#!/bin/bash

echo "🚀 Setting up Warp for Existing MCP Server"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop and remove existing Warp container if it exists
echo -e "${BLUE}Cleaning up existing Warp container...${NC}"
docker stop cloudflare-warp 2>/dev/null || true
docker rm cloudflare-warp 2>/dev/null || true

# Create a temporary container to run Warp commands
echo -e "${BLUE}Creating temporary Warp container...${NC}"
docker run --name warp-setup -d --entrypoint sleep cloudflare/cloudflared:latest 3600

# Create a tunnel
echo -e "${BLUE}Creating Warp tunnel...${NC}"
TUNNEL_NAME="mcp-tunnel-$(date +%s)"
TUNNEL_ID=$(docker exec warp-setup cloudflared tunnel create $TUNNEL_NAME | grep -oP 'Created tunnel \K[a-z0-9-]+')

if [ -z "$TUNNEL_ID" ]; then
    echo -e "${RED}Failed to create tunnel${NC}"
    docker stop warp-setup
    docker rm warp-setup
    exit 1
fi

echo -e "${GREEN}Created tunnel: $TUNNEL_NAME with ID: $TUNNEL_ID${NC}"

# Create config file
echo -e "${BLUE}Creating tunnel config file...${NC}"
cat > config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: mcp.localhost
    service: http://localhost:8888
  - service: http_status:404
EOF

# Copy config to container
echo -e "${BLUE}Copying config to container...${NC}"
docker cp config.yml warp-setup:/etc/cloudflared/config.yml

# Extract credentials
echo -e "${BLUE}Extracting credentials...${NC}"
docker exec warp-setup mkdir -p /root/.cloudflared
docker exec warp-setup cloudflared tunnel token $TUNNEL_ID > /dev/null 2>&1
docker cp warp-setup:/root/.cloudflared/${TUNNEL_ID}.json credentials.json

# Clean up temporary container
echo -e "${BLUE}Cleaning up temporary container...${NC}"
docker stop warp-setup
docker rm warp-setup

# Create persistent Warp container
echo -e "${BLUE}Starting persistent Warp container...${NC}"
docker run -d \
    --name cloudflare-warp \
    --restart unless-stopped \
    --network host \
    -v $(pwd)/config.yml:/etc/cloudflared/config.yml:ro \
    -v $(pwd)/credentials.json:/etc/cloudflared/credentials.json:ro \
    cloudflare/cloudflared:latest \
    tunnel run

echo -e "${GREEN}✅ Warp setup complete!${NC}"
echo -e "${YELLOW}Your MCP server is now accessible via Warp${NC}"
echo -e "${YELLOW}You can access it locally at:${NC} http://mcp.localhost"
echo ""
echo -e "${BLUE}Tunnel Name:${NC} $TUNNEL_NAME"
echo -e "${BLUE}Tunnel ID:${NC} $TUNNEL_ID"
echo ""
echo -e "${GREEN}To stop Warp:${NC} docker stop cloudflare-warp"
echo -e "${GREEN}To start Warp:${NC} docker start cloudflare-warp" 