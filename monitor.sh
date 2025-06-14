#!/bin/bash

echo "🔍 Commerce Dashboard - System Monitor"
echo "===================================="

# Configuration
SSH_KEY="~/.ssh/id_ed25519_github"
SERVER_IP="137.184.53.98"
REMOTE_DIR="/var/www/commerce-dashboard"
LOG_DIR="logs"
MONITOR_LOG="$LOG_DIR/system_monitor.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Log function
log() {
  local message="$1"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $message" >> $MONITOR_LOG
  echo -e "$message"
}

# Check if server is reachable
check_server() {
  log "${BLUE}Checking if server is reachable...${NC}"
  
  ssh -i $SSH_KEY -o ConnectTimeout=5 root@$SERVER_IP "echo Connected" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    log "${RED}ERROR: Server is unreachable${NC}"
    return 1
  else
    log "${GREEN}Server is reachable${NC}"
    return 0
  fi
}

# Check if commerce-dashboard service is running
check_service() {
  log "${BLUE}Checking if commerce-dashboard service is running...${NC}"
  
  local service_status=$(ssh -i $SSH_KEY root@$SERVER_IP "pm2 list | grep commerce-dashboard | grep online | wc -l")
  if [ "$service_status" -eq "1" ]; then
    log "${GREEN}Service is running${NC}"
    return 0
  else
    log "${RED}ERROR: Service is not running${NC}"
    return 1
  fi
}

# Check disk space
check_disk() {
  log "${BLUE}Checking disk space...${NC}"
  
  local disk_usage=$(ssh -i $SSH_KEY root@$SERVER_IP "df -h | grep -E '/$' | awk '{print \$5}' | sed 's/%//'")
  if [ "$disk_usage" -gt "80" ]; then
    log "${YELLOW}WARNING: Disk usage is high: ${disk_usage}%${NC}"
  else
    log "${GREEN}Disk usage is normal: ${disk_usage}%${NC}"
  fi
}

# Check memory usage
check_memory() {
  log "${BLUE}Checking memory usage...${NC}"
  
  local memory_free=$(ssh -i $SSH_KEY root@$SERVER_IP "free -m | grep Mem | awk '{print \$4}'")
  local memory_total=$(ssh -i $SSH_KEY root@$SERVER_IP "free -m | grep Mem | awk '{print \$2}'")
  local memory_usage=$((100 - (memory_free * 100 / memory_total)))
  
  if [ "$memory_usage" -gt "80" ]; then
    log "${YELLOW}WARNING: Memory usage is high: ${memory_usage}%${NC}"
  else
    log "${GREEN}Memory usage is normal: ${memory_usage}%${NC}"
  fi
}

# Check CPU load
check_cpu() {
  log "${BLUE}Checking CPU load...${NC}"
  
  local cpu_load=$(ssh -i $SSH_KEY root@$SERVER_IP "cat /proc/loadavg | cut -d' ' -f1")
  local cpu_cores=$(ssh -i $SSH_KEY root@$SERVER_IP "nproc")
  local cpu_load_per_core=$(echo "$cpu_load / $cpu_cores" | bc -l)
  
  if (( $(echo "$cpu_load_per_core > 0.8" | bc -l) )); then
    log "${YELLOW}WARNING: CPU load is high: ${cpu_load} (${cpu_load_per_core} per core)${NC}"
  else
    log "${GREEN}CPU load is normal: ${cpu_load} (${cpu_load_per_core} per core)${NC}"
  fi
}

# Check database connection
check_database() {
  log "${BLUE}Checking database connection...${NC}"
  
  local db_status=$(ssh -i $SSH_KEY root@$SERVER_IP "cd $REMOTE_DIR && node -e \"require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce-dashboard').then(() => {console.log('connected'); process.exit(0);}).catch(() => {console.log('failed'); process.exit(1);})\"")
  
  if [ "$db_status" == "connected" ]; then
    log "${GREEN}Database connection is working${NC}"
  else
    log "${RED}ERROR: Database connection failed${NC}"
  fi
}

# Check API endpoints
check_api() {
  log "${BLUE}Checking API endpoints...${NC}"
  
  local api_status=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/api/products)
  
  if [ "$api_status" == "200" ]; then
    log "${GREEN}API is responding correctly${NC}"
  else
    log "${RED}ERROR: API returned status code ${api_status}${NC}"
  fi
}

# Check GPU status for computational tasks
check_gpu() {
  log "${BLUE}Checking GPU status...${NC}"
  
  # This assumes nvidia-smi is available on the server
  local gpu_status=$(ssh -i $SSH_KEY root@$SERVER_IP "command -v nvidia-smi > /dev/null && nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits || echo 'N/A'")
  
  if [ "$gpu_status" != "N/A" ]; then
    if [ "$gpu_status" -gt "80" ]; then
      log "${YELLOW}WARNING: GPU utilization is high: ${gpu_status}%${NC}"
    else
      log "${GREEN}GPU utilization is normal: ${gpu_status}%${NC}"
    fi
  else
    log "${YELLOW}GPU status check not available${NC}"
  fi
}

# Run all checks
run_checks() {
  log "========== Starting system check at $(date) =========="
  
  check_server
  if [ $? -eq 0 ]; then
    check_service
    check_disk
    check_memory
    check_cpu
    check_database
    check_api
    check_gpu
  fi
  
  log "========== Completed system check =========="
}

# Run the checks
run_checks

echo -e "${BLUE}Monitor log saved to ${MONITOR_LOG}${NC}" 