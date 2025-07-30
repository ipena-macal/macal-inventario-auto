#!/bin/bash

echo "🔍 EC2 DIAGNOSTIC COMMANDS"
echo "========================="
echo ""
echo "Run these commands after connecting to EC2:"
echo ""
cat << 'COMMANDS'
# Connect to EC2:
aws ssm start-session --target i-09bb7ca5173ff79b1

# Once connected, run these diagnostic commands:

echo "=== Current Directory ==="
pwd
ls -la

echo -e "\n=== Check macal-inventory directory ==="
ls -la /home/ec2-user/macal-inventory/

echo -e "\n=== Check Node.js version ==="
node --version

echo -e "\n=== Check PM2 processes ==="
pm2 list

echo -e "\n=== Check PM2 logs ==="
pm2 logs --lines 20

echo -e "\n=== Check what's running on port 3001 ==="
sudo netstat -tlnp | grep 3001

echo -e "\n=== Check server.js content ==="
head -20 /home/ec2-user/macal-inventory/server.js

echo -e "\n=== Try to start manually ==="
cd /home/ec2-user/macal-inventory
node server.js
COMMANDS

echo ""
echo "Copy and paste these commands to diagnose the issue."