#!/bin/bash

echo "⏱️ Commerce Dashboard - Cron Job Setup"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current directory
CURRENT_DIR=$(pwd)

# Create temporary crontab file
TMP_CRON=$(mktemp)

# Export current crontab
crontab -l > $TMP_CRON 2>/dev/null || echo "# Commerce Dashboard Cron Jobs" > $TMP_CRON

# Check if cron jobs already exist
if grep -q "commerce-dashboard" $TMP_CRON; then
  echo -e "${YELLOW}Commerce Dashboard cron jobs already exist. Updating...${NC}"
  # Remove existing commerce-dashboard cron jobs
  grep -v "commerce-dashboard" $TMP_CRON > ${TMP_CRON}.new
  mv ${TMP_CRON}.new $TMP_CRON
fi

# Add header
echo "" >> $TMP_CRON
echo "# Commerce Dashboard Cron Jobs - Added $(date)" >> $TMP_CRON

# Add monitoring job (every hour)
echo -e "${BLUE}Adding hourly monitoring job...${NC}"
echo "0 * * * * cd $CURRENT_DIR && ./monitor.sh >> logs/cron.log 2>&1 # commerce-dashboard" >> $TMP_CRON

# Add database update job (daily at 2 AM)
echo -e "${BLUE}Adding daily database update job...${NC}"
echo "0 2 * * * cd $CURRENT_DIR && node update_database.js >> logs/cron.log 2>&1 # commerce-dashboard" >> $TMP_CRON

# Add server update job (weekly on Sunday at 3 AM)
echo -e "${BLUE}Adding weekly server update job...${NC}"
echo "0 3 * * 0 cd $CURRENT_DIR && ./update_all.sh >> logs/cron.log 2>&1 # commerce-dashboard" >> $TMP_CRON

# Add MCP update job (daily at 4 AM)
echo -e "${BLUE}Adding daily MCP update job...${NC}"
echo "0 4 * * * cd $CURRENT_DIR && ./update_mcp.sh >> logs/cron.log 2>&1 # commerce-dashboard" >> $TMP_CRON

# Install new crontab
echo -e "${BLUE}Installing crontab...${NC}"
crontab $TMP_CRON

# Check if crontab was installed successfully
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Cron jobs installed successfully!${NC}"
  echo -e "${BLUE}The following jobs were added:${NC}"
  echo -e "  - Hourly system monitoring"
  echo -e "  - Daily database update at 2 AM"
  echo -e "  - Weekly server update on Sunday at 3 AM"
  echo -e "  - Daily MCP update at 4 AM"
else
  echo -e "${RED}Failed to install cron jobs${NC}"
fi

# Clean up
rm $TMP_CRON

# Create logs directory if it doesn't exist
mkdir -p logs
echo -e "${BLUE}Logs will be stored in $CURRENT_DIR/logs/cron.log${NC}"

echo -e "${GREEN}Cron job setup completed!${NC}" 