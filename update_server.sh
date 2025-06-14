#!/bin/bash

echo "🚀 DigitalOcean Server Update Script"
echo "=================================="

# Configuration
SSH_KEY="~/.ssh/id_ed25519_github"
SERVER_IP="137.184.53.98"
REMOTE_DIR="/var/www/commerce-dashboard"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check SSH connection
echo -e "${BLUE}Checking connection to server...${NC}"
ssh -i $SSH_KEY -o ConnectTimeout=5 root@$SERVER_IP "echo Connected" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Cannot connect to server${NC}"
  echo "Please check your SSH key and server IP"
  exit 1
fi
echo -e "${GREEN}Connection successful${NC}"

# Update server from GitHub
echo -e "${BLUE}Updating server from GitHub...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "cd $REMOTE_DIR && git pull origin main"
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to update from GitHub${NC}"
  exit 1
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "cd $REMOTE_DIR && npm install"
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to install dependencies${NC}"
  exit 1
fi

# Upload database update script
echo -e "${BLUE}Uploading database update script...${NC}"
scp -i $SSH_KEY update_database.js root@$SERVER_IP:$REMOTE_DIR/
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to upload database update script${NC}"
  exit 1
fi

# Update database
echo -e "${BLUE}Updating database...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "cd $REMOTE_DIR && node update_database.js"
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Database update failed. Continuing...${NC}"
fi

# Upload blog post
echo -e "${BLUE}Uploading blog post...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "mkdir -p $REMOTE_DIR/blog"
scp -i $SSH_KEY blog/digital-products-launch.md root@$SERVER_IP:$REMOTE_DIR/blog/
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Failed to upload blog post. Continuing...${NC}"
fi

# Restart server
echo -e "${BLUE}Restarting server...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "cd $REMOTE_DIR && pm2 restart commerce-dashboard"
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to restart server${NC}"
  exit 1
fi

# Check server status
echo -e "${BLUE}Checking server status...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "pm2 status commerce-dashboard"
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to check server status${NC}"
  exit 1
fi

# Check disk space
echo -e "${BLUE}Checking server disk space...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "df -h | grep -E '/$|/var'"

# Check memory usage
echo -e "${BLUE}Checking server memory usage...${NC}"
ssh -i $SSH_KEY root@$SERVER_IP "free -m"

echo -e "${GREEN}✅ Server update completed successfully!${NC}"
echo -e "${BLUE}Server is running at http://$SERVER_IP${NC}" 