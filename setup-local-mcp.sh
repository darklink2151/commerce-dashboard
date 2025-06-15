#!/bin/bash

echo "🚀 Setting up Local Docker MCP Server with Warp Access"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p mcp
mkdir -p commerce-dashboard-data

# Copy files from commerce-dashboard if available
echo -e "${BLUE}Copying commerce dashboard data...${NC}"
if [ -d "data" ]; then
    cp -r data/* commerce-dashboard-data/
    echo -e "${GREEN}Copied data from commerce-dashboard${NC}"
else
    echo -e "${YELLOW}No data directory found. Creating sample data...${NC}"
    
    # Create sample products.json
    cat > commerce-dashboard-data/products.json << EOF
[
  {
    "id": "sample-product",
    "name": "Sample Product",
    "price": 19.99,
    "description": "This is a sample product for the MCP server.",
    "image": "https://via.placeholder.com/400x300",
    "category": "Sample",
    "type": "digital"
  }
]
EOF
fi

# Create MCP index file
echo -e "${BLUE}Creating MCP index file...${NC}"
cat > mcp/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Server</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #e0e0e0;
            background: #121212;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #ff3e3e;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .card {
            background: #1e1e1e;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #333;
        }
        h2 {
            color: #ffffff;
            margin-top: 0;
        }
        pre {
            background: #252525;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border: 1px solid #333;
        }
        a {
            color: #ff3e3e;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>MCP Server</h1>
    
    <div class="card">
        <h2>Server Information</h2>
        <p>This is your local MCP server for managing commerce dashboard data.</p>
        <p>Access your files at: <a href="/commerce_dashboard">/commerce_dashboard</a></p>
    </div>
    
    <div class="card">
        <h2>Available Commands</h2>
        <pre>
# List products
cat /mcp/commerce_dashboard/products.json | jq '.[].name'

# Get product details
cat /mcp/commerce_dashboard/products.json | jq '.[] | select(.id=="sample-product")'
        </pre>
    </div>
</body>
</html>
EOF

# Create commands reference file
echo -e "${BLUE}Creating commands reference file...${NC}"
cat > commerce-dashboard-data/mcp_commands.md << 'EOF'
# MCP Server Commands

## Product Management

```bash
# List products
cat /mcp/commerce_dashboard/products.json | jq '.[].name'

# Get product details
cat /mcp/commerce_dashboard/products.json | jq '.[] | select(.id=="sample-product")'
```

## Docker Commands

```bash
# Check container status
docker ps

# View logs
docker logs mcp-server

# Restart container
docker restart mcp-server
```

## System Information

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check Docker stats
docker stats
```
EOF

# Create product info file
echo -e "${BLUE}Creating product info file...${NC}"
cat > commerce-dashboard-data/mcp_product_info.json << EOF
{
  "commerce_dashboard": {
    "url": "http://localhost:8080",
    "api_endpoints": {
      "products": "http://localhost:8080/commerce_dashboard/products.json"
    },
    "last_updated": "$(date +"%Y-%m-%d %H:%M:%S")"
  }
}
EOF

# Check if warp-local-mcp-config.json exists
if [ ! -f "warp-local-mcp-config.json" ]; then
    echo -e "${RED}Error: warp-local-mcp-config.json file not found${NC}"
    exit 1
fi

# Check if docker-compose-mcp.yml exists
if [ ! -f "docker-compose-mcp.yml" ]; then
    echo -e "${RED}Error: docker-compose-mcp.yml file not found${NC}"
    exit 1
fi

# Start Docker containers
echo -e "${BLUE}Starting Docker containers...${NC}"
docker-compose -f docker-compose-mcp.yml up -d

# Wait for containers to start
echo -e "${YELLOW}Waiting for containers to start...${NC}"
sleep 5

# Check if containers are running
echo -e "${BLUE}Checking container status...${NC}"
docker ps | grep -E 'mcp-server|cloudflare-warp'

echo -e "${GREEN}✅ Local MCP server setup complete!${NC}"
echo -e "${YELLOW}Your MCP server is accessible at:${NC}"
echo -e "${BLUE}http://localhost:8080${NC}"
echo -e "${YELLOW}Your commerce dashboard data is at:${NC}"
echo -e "${BLUE}http://localhost:8080/commerce_dashboard${NC}"
echo ""
echo -e "${GREEN}To stop the MCP server:${NC} docker-compose -f docker-compose-mcp.yml down"
echo -e "${GREEN}To restart the MCP server:${NC} docker-compose -f docker-compose-mcp.yml restart" 