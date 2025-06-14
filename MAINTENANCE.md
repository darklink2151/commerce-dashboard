# Commerce Dashboard Maintenance Guide

This document provides information about maintaining and updating the Commerce Dashboard application, including the database, MCP server, and DigitalOcean deployment.

## Scripts Overview

We've created several scripts to automate maintenance tasks:

### 1. Database Update Script (`update_database.js`)

Updates the MongoDB database with product information from the `data/products.json` file.

**Usage:**
```bash
node update_database.js
```

### 2. MCP Server Update Script (`update_mcp.sh`)

Updates the MCP server with product information and commands.

**Usage:**
```bash
./update_mcp.sh
```

**Note:** Before using this script, edit it to set your MCP server IP address.

### 3. DigitalOcean Server Update Script (`update_server.sh`)

Updates the DigitalOcean server with the latest code and database.

**Usage:**
```bash
./update_server.sh
```

### 4. Complete Update Script (`update_all.sh`)

Runs a complete update of the local server, database, and MCP server.

**Usage:**
```bash
./update_all.sh
```

### 5. System Monitoring Script (`monitor.sh`)

Monitors the health of the DigitalOcean server, including disk space, memory usage, CPU load, database connection, API endpoints, and GPU status.

**Usage:**
```bash
./monitor.sh
```

### 6. Cron Job Setup Script (`setup_cron.sh`)

Sets up automated cron jobs for monitoring and updates.

**Usage:**
```bash
./setup_cron.sh
```

## Cron Jobs

The following cron jobs are set up by the `setup_cron.sh` script:

- **Hourly system monitoring** - Runs every hour
- **Daily database update** - Runs at 2 AM every day
- **Weekly server update** - Runs at 3 AM every Sunday
- **Daily MCP update** - Runs at 4 AM every day

All cron job logs are stored in the `logs/cron.log` file.

## Server Information

- **DigitalOcean Server IP:** 137.184.53.98
- **Server Directory:** /var/www/commerce-dashboard
- **SSH Key:** ~/.ssh/id_ed25519_github

## Digital Products

The digital products are stored in the `secure/` directory on the server. Each product is packaged as a ZIP file with the following naming convention:

- `automation-toolkit.zip` - Python Automation Toolkit
- `performance-optimization-guide.zip` - Performance Optimization Guide
- `security-scanner.zip` - Security Scanner
- `workflow-templates.zip` - Workflow Templates
- `system-optimizer.zip` - System Optimizer

## Blog Posts

Blog posts are stored in the `blog/` directory. The latest blog post is `digital-products-launch.md`.

## GPU Configuration

The server uses two GPUs:
- ASRock 6600 Challenger for display
- Zotac 3050 for computational tasks

## Maintenance Tasks

### Regular Maintenance

1. **Daily:**
   - Check system monitor logs
   - Verify database backups

2. **Weekly:**
   - Review server updates
   - Check for security updates

3. **Monthly:**
   - Update product information
   - Review and update blog posts

### Troubleshooting

If the server is not responding:

1. Check if the server is reachable:
   ```bash
   ssh -i ~/.ssh/id_ed25519_github root@137.184.53.98 "echo Connected"
   ```

2. Check if the service is running:
   ```bash
   ssh -i ~/.ssh/id_ed25519_github root@137.184.53.98 "pm2 status"
   ```

3. Restart the service if needed:
   ```bash
   ssh -i ~/.ssh/id_ed25519_github root@137.184.53.98 "cd /var/www/commerce-dashboard && pm2 restart commerce-dashboard"
   ```

4. Check the logs:
   ```bash
   ssh -i ~/.ssh/id_ed25519_github root@137.184.53.98 "pm2 logs commerce-dashboard"
   ```

## Contact Information

For any issues or questions, please contact the tech team. 