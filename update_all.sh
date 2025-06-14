#!/bin/bash

echo "🚀 Commerce Dashboard - Complete Update Script"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in the correct directory
if [ ! -f "server.js" ]; then
  echo -e "${RED}Error: Must run from commerce-dashboard root directory${NC}"
  exit 1
fi

# Step 1: Update from GitHub
echo -e "${BLUE}Step 1: Updating from GitHub...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Git pull failed or no changes. Continuing...${NC}"
fi

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to install dependencies${NC}"
  exit 1
fi

# Step 3: Update database
echo -e "${BLUE}Step 3: Updating database...${NC}"
node update_database.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Database update failed${NC}"
  echo -e "${YELLOW}Check MongoDB connection and try again${NC}"
  exit 1
fi

# Step 4: Check for PM2
echo -e "${BLUE}Step 4: Checking for PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}PM2 not found. Installing globally...${NC}"
  npm install -g pm2
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install PM2${NC}"
    exit 1
  fi
fi

# Step 5: Restart server
echo -e "${BLUE}Step 5: Restarting server...${NC}"
pm2 list | grep commerce-dashboard > /dev/null
if [ $? -eq 0 ]; then
  # Server is already running in PM2, restart it
  pm2 restart commerce-dashboard
else
  # Server is not running in PM2, start it
  pm2 start server.js --name commerce-dashboard
fi

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to restart server${NC}"
  exit 1
fi

# Step 6: Update MCP server if configured
echo -e "${BLUE}Step 6: Checking for MCP server update script...${NC}"
if [ -f "update_mcp.sh" ]; then
  echo -e "${YELLOW}MCP update script found. Running...${NC}"
  ./update_mcp.sh
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: MCP server update failed. Check the script configuration.${NC}"
  else
    echo -e "${GREEN}MCP server update completed successfully${NC}"
  fi
else
  echo -e "${YELLOW}MCP update script not found. Skipping MCP server update.${NC}"
fi

# Step 7: Check server status
echo -e "${BLUE}Step 7: Checking server status...${NC}"
pm2 status commerce-dashboard
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to check server status${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Update completed successfully!${NC}"
echo -e "${BLUE}Server is running at http://localhost:3000${NC}"
echo -e "${BLUE}Remote server is running at http://137.184.53.98${NC}"
echo -e "${YELLOW}Blog post created at blog/digital-products-launch.md${NC}" 